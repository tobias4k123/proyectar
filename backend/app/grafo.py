import networkx as nx
from sqlalchemy.orm import Session

from . import models


def construir_grafo(db: Session) -> nx.MultiDiGraph:
    """
    Arma un grafo dirigido con una materia por nodo y una arista por cada
    correlatividad. La arista va de la correlativa (prerequisito) hacia
    la materia que la necesita -- el sentido natural de "dependencia".

    Es un MultiDiGraph (no un DiGraph simple) porque el mismo par de
    materias suele tener DOS aristas -- una para "cursar" y otra para
    "rendir el final" -- y un DiGraph normal solo admite una arista por
    par de nodos, pisando silenciosamente la segunda.
    """
    G = nx.MultiDiGraph()
    for m in db.query(models.Materia).all():
        G.add_node(m.id, codigo=m.codigo, nombre=m.nombre, anio_carrera=m.anio_carrera)

    for c in db.query(models.Correlatividad).all():
        G.add_edge(c.correlativa_id, c.materia_id, tipo=c.tipo, requiere=c.requiere)

    return G


def _contexto_historial(db: Session, alumno_id: int, simulacion_aprobadas: set[int] | None = None):
    """
    Junta, para un alumno, que tiene realmente en su historial y (si se
    esta simulando) que materias extra se consideran aprobadas "de
    mentira" para el calculo -- sin tocar la base de datos.
    """
    historial = (
        db.query(models.HistorialAcademico)
        .filter(models.HistorialAcademico.alumno_id == alumno_id)
        .all()
    )
    historial_por_materia = {h.materia_id: h for h in historial}

    aprobadas_reales_ids = {
        h.materia_id for h in historial if h.estado == models.EstadoHistorial.APROBADA
    }
    simuladas_ids = (simulacion_aprobadas or set()) - aprobadas_reales_ids
    aprobadas_ids = aprobadas_reales_ids | simuladas_ids

    cursada_satisfecha_ids = aprobadas_ids | {
        h.materia_id for h in historial if h.estado == models.EstadoHistorial.REGULAR
    }

    return historial_por_materia, aprobadas_ids, cursada_satisfecha_ids, simuladas_ids


def calcular_estados(
    db: Session, alumno_id: int, simulacion_aprobadas: set[int] | None = None
) -> list[dict]:
    """
    Para cada materia del plan, calcula su estado visual para el alumno
    dado (aprobada / cursando / regular / disponible / bloqueada) y, si
    esta en estado "regular", si ya puede rendir el final.

    Si se pasa `simulacion_aprobadas`, esas materias se tratan como
    aprobadas para el calculo (sin persistir nada) y quedan marcadas con
    `simulado=True` en el resultado -- es la base del modo simulacion.
    """
    G = construir_grafo(db)
    historial_por_materia, aprobadas_ids, cursada_satisfecha_ids, simuladas_ids = (
        _contexto_historial(db, alumno_id, simulacion_aprobadas)
    )

    resultado = []
    for materia_id, datos in G.nodes(data=True):
        h = historial_por_materia.get(materia_id)
        simulado = materia_id in simuladas_ids

        if simulado:
            estado_visual = "aprobada"
        elif h and h.estado == models.EstadoHistorial.APROBADA:
            estado_visual = "aprobada"
        elif h and h.estado == models.EstadoHistorial.CURSANDO:
            estado_visual = "cursando"
        elif h and h.estado == models.EstadoHistorial.REGULAR:
            estado_visual = "regular"
        else:
            # sin historial, o "libre": se evalua si esta disponible o
            # bloqueada segun las correlatividades tipo CURSAR
            requisitos_cursar = [
                (origen, attrs)
                for origen, _, attrs in G.in_edges(materia_id, data=True)
                if attrs["tipo"] == models.TipoCorrelatividad.CURSAR
            ]
            cumple_todos = all(
                (origen in aprobadas_ids)
                if attrs["requiere"] == models.RequisitoEnum.APROBADA
                else (origen in cursada_satisfecha_ids)
                for origen, attrs in requisitos_cursar
            )
            estado_visual = "disponible" if cumple_todos else "bloqueada"

        puede_rendir_final = None
        if estado_visual == "regular":
            requisitos_final = [
                (origen, attrs)
                for origen, _, attrs in G.in_edges(materia_id, data=True)
                if attrs["tipo"] == models.TipoCorrelatividad.FINAL
            ]
            # Igual que con "cursar": cada correlatividad puede exigir la
            # materia aprobada o solo cursada (regular), no siempre lo mismo.
            puede_rendir_final = all(
                (origen in aprobadas_ids)
                if attrs["requiere"] == models.RequisitoEnum.APROBADA
                else (origen in cursada_satisfecha_ids)
                for origen, attrs in requisitos_final
            )

        resultado.append(
            {
                "materia_id": materia_id,
                "codigo": datos["codigo"],
                "nombre": datos["nombre"],
                "anio_carrera": datos["anio_carrera"],
                "estado": estado_visual,
                "puede_rendir_final": puede_rendir_final,
                "simulado": simulado,
            }
        )

    return resultado


def calcular_ruta_critica(
    db: Session, alumno_id: int, simulacion_aprobadas: set[int] | None = None
) -> list[dict]:
    """
    Cadena mas larga de materias que todavia le faltan al alumno,
    ordenada de la primera a resolver a la ultima. Es la nocion de "ruta
    critica" del informe: la secuencia de materias que, si se retrasa
    alguna, retrasa toda la carrera -- la materia que dio origen al
    proyecto (con muchas otras dependiendo de ella) va a aparecer acá.

    Para esta cadena no importa si la correlatividad es de tipo "cursar"
    o "final": lo unico relevante es que materia depende de cual, y en
    los datos reales del plan casi todos los pares tienen las dos
    aristas de todos modos. Se colapsan ambas en un grafo simple (sin
    multi-aristas) porque a `nx.dag_longest_path` solo le importa la
    cantidad de materias en la cadena, no cuantas aristas hay entre cada
    par.
    """
    _, aprobadas_ids, _, _ = _contexto_historial(db, alumno_id, simulacion_aprobadas)

    pendientes = nx.DiGraph()
    for m in db.query(models.Materia).all():
        if m.id in aprobadas_ids:
            continue
        pendientes.add_node(m.id, codigo=m.codigo, nombre=m.nombre, anio_carrera=m.anio_carrera)

    for c in db.query(models.Correlatividad).all():
        if c.correlativa_id in aprobadas_ids or c.materia_id in aprobadas_ids:
            continue
        pendientes.add_edge(c.correlativa_id, c.materia_id)

    if len(pendientes) == 0:
        return []

    camino_ids = nx.dag_longest_path(pendientes)

    estados_por_materia = {
        n["materia_id"]: n
        for n in calcular_estados(db, alumno_id, simulacion_aprobadas)
    }
    return [estados_por_materia[materia_id] for materia_id in camino_ids]


def listar_aristas(db: Session) -> list[dict]:
    return [
        {
            "origen_id": c.correlativa_id,
            "destino_id": c.materia_id,
            "tipo": c.tipo.value,
            "requiere": c.requiere.value,
        }
        for c in db.query(models.Correlatividad).all()
    ]
