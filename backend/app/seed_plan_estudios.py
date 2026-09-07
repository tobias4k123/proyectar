"""
Carga inicial del plan de estudios real de la Tecnicatura en Analisis de
Sistemas (Plan 634, IFES Neuquen), segun el Regimen de Correlatividades
(Resolucion 1328, Expediente 5721-007254/14).

Uso (con los contenedores corriendo):
    docker compose exec backend python -m app.seed_plan_estudios

Es idempotente: si una materia con ese codigo ya existe no se duplica,
y lo mismo para cada correlatividad.
"""
from .database import SessionLocal
from .models import Correlatividad, Materia, RequisitoEnum, TipoCorrelatividad

# (codigo, nombre, anio_carrera)
MATERIAS = [
    ("634-01-01", "Matemática I", 1),
    ("634-01-02", "Sistemas de Computación I", 1),
    ("634-01-03", "Inglés I", 1),
    ("634-01-04", "Introducción al Pensamiento Lógico", 1),
    ("634-01-05", "Introducción a la Programación", 1),
    ("634-01-06", "Matemática II", 1),
    ("634-01-07", "Sistemas Operativos", 1),
    ("634-01-08", "Sistemas de Computación II", 1),
    ("634-02-01", "Programación I", 2),
    ("634-02-02", "Inglés II", 2),
    ("634-02-03", "Base de Datos", 2),
    ("634-02-04", "Análisis de Sistemas", 2),
    ("634-02-05", "Programación II", 2),
    ("634-02-06", "Organización de la Empresa", 2),
    ("634-02-07", "Diseño de Sistemas", 2),
    ("634-02-08", "Práctica Profesionalizante I", 2),
    ("634-03-01", "Práctica Profesionalizante II", 3),
    ("634-03-02", "Programación Web I", 3),
    ("634-03-03", "Redes", 3),
    ("634-03-04", "Nuevas Tendencias en Hardware", 3),
    ("634-03-05", "Programación Web II", 3),
    ("634-03-06", "Marketing Profesional", 3),
    ("634-03-07", "Nuevas Tendencias en Software", 3),
]

CURSAR, FINAL = TipoCorrelatividad.CURSAR, TipoCorrelatividad.FINAL
CURSADA, APROBADA = RequisitoEnum.CURSADA, RequisitoEnum.APROBADA

# (codigo_materia, codigo_correlativa, tipo, requiere)
CORRELATIVIDADES = [
    ("634-01-05", "634-01-04", CURSAR, CURSADA),
    ("634-01-05", "634-01-04", FINAL, APROBADA),
    ("634-01-06", "634-01-01", FINAL, APROBADA),
    ("634-01-08", "634-01-02", FINAL, APROBADA),
    ("634-02-01", "634-01-05", CURSAR, CURSADA),
    ("634-02-01", "634-01-05", FINAL, APROBADA),
    ("634-02-02", "634-01-03", CURSAR, CURSADA),
    ("634-02-02", "634-01-03", FINAL, APROBADA),
    ("634-02-05", "634-02-01", CURSAR, CURSADA),
    ("634-02-05", "634-02-01", FINAL, APROBADA),
    ("634-02-07", "634-02-04", CURSAR, CURSADA),
    ("634-02-07", "634-02-04", FINAL, APROBADA),
    ("634-02-08", "634-02-01", CURSAR, APROBADA),
    ("634-02-08", "634-02-04", CURSAR, APROBADA),
    ("634-02-08", "634-02-01", FINAL, APROBADA),
    ("634-02-08", "634-02-04", FINAL, APROBADA),
    ("634-03-02", "634-02-05", CURSAR, CURSADA),
    ("634-03-02", "634-02-05", FINAL, APROBADA),
    ("634-03-05", "634-03-02", CURSAR, CURSADA),
    ("634-03-05", "634-03-02", FINAL, APROBADA),
    ("634-03-01", "634-02-05", CURSAR, APROBADA),
    ("634-03-01", "634-02-07", CURSAR, APROBADA),
    ("634-03-01", "634-02-08", CURSAR, APROBADA),
    # Para rendir el final de Practica Profesionalizante II (634-03-01)
    # se necesitan TODAS las demas materias del plan aprobadas. Se
    # modela como una arista explicita por cada una (mas abajo, generado
    # en el loop) en vez de una regla especial en el codigo del grafo.
]


def cargar_plan_de_estudios():
    db = SessionLocal()
    try:
        materias_por_codigo = {}
        creadas = 0
        for codigo, nombre, anio in MATERIAS:
            existente = db.query(Materia).filter(Materia.codigo == codigo).first()
            if existente:
                materias_por_codigo[codigo] = existente
                continue
            nueva = Materia(codigo=codigo, nombre=nombre, anio_carrera=anio)
            db.add(nueva)
            db.flush()
            materias_por_codigo[codigo] = nueva
            creadas += 1

        correlatividades = list(CORRELATIVIDADES)
        for codigo in materias_por_codigo:
            if codigo != "634-03-01":
                correlatividades.append(("634-03-01", codigo, FINAL, APROBADA))

        correlatividades_creadas = 0
        for codigo_materia, codigo_correlativa, tipo, requiere in correlatividades:
            materia = materias_por_codigo[codigo_materia]
            correlativa = materias_por_codigo[codigo_correlativa]

            ya_existe = (
                db.query(Correlatividad)
                .filter_by(materia_id=materia.id, correlativa_id=correlativa.id, tipo=tipo)
                .first()
            )
            if ya_existe:
                continue

            db.add(
                Correlatividad(
                    materia_id=materia.id,
                    correlativa_id=correlativa.id,
                    tipo=tipo,
                    requiere=requiere,
                )
            )
            correlatividades_creadas += 1

        db.commit()
        print(
            f"Materias nuevas: {creadas} (total {len(materias_por_codigo)}). "
            f"Correlatividades nuevas: {correlatividades_creadas} "
            f"(total {len(correlatividades)})."
        )
    finally:
        db.close()


if __name__ == "__main__":
    cargar_plan_de_estudios()
