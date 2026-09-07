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


def calcular_estados(db: Session, alumno_id: int) -> list[dict]:
    """
    Para cada materia del plan, calcula su estado visual para el alumno
    dado (aprobada / cursando / regular / disponible / bloqueada) y, si
    esta en estado "regular", si ya puede rendir el final.
    """
    G = construir_grafo(db)

    historial = (
        db.query(models.HistorialAcademico)
        .filter(models.HistorialAcademico.alumno_id == alumno_id)
        .all()
    )
    historial_por_materia = {h.materia_id: h for h in historial}

    aprobadas_ids = {
        h.materia_id for h in historial if h.estado == models.EstadoHistorial.APROBADA
    }
    cursada_satisfecha_ids = aprobadas_ids | {
        h.materia_id for h in historial if h.estado == models.EstadoHistorial.REGULAR
    }

    resultado = []
    for materia_id, datos in G.nodes(data=True):
        h = historial_por_materia.get(materia_id)

        if h and h.estado == models.EstadoHistorial.APROBADA:
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
                origen
                for origen, _, attrs in G.in_edges(materia_id, data=True)
                if attrs["tipo"] == models.TipoCorrelatividad.FINAL
            ]
            puede_rendir_final = all(origen in aprobadas_ids for origen in requisitos_final)

        resultado.append(
            {
                "materia_id": materia_id,
                "codigo": datos["codigo"],
                "nombre": datos["nombre"],
                "anio_carrera": datos["anio_carrera"],
                "estado": estado_visual,
                "puede_rendir_final": puede_rendir_final,
            }
        )

    return resultado


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
