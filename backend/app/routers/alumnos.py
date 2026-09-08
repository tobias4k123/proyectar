from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import grafo, models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(prefix="/alumnos", tags=["Alumnos"])

# Transiciones válidas: a qué estado se puede llegar desde cuál (None =
# la materia todavía no tiene registro de historial). APROBADA admite
# venir tanto de REGULAR (rindió el final) como de CURSANDO directo
# (promoción -- en IFES todas las materias son promocionables).
_ORIGENES_VALIDOS = {
    models.EstadoHistorial.CURSANDO: {None, models.EstadoHistorial.LIBRE, models.EstadoHistorial.CURSANDO},
    models.EstadoHistorial.REGULAR: {models.EstadoHistorial.CURSANDO},
    models.EstadoHistorial.APROBADA: {models.EstadoHistorial.CURSANDO, models.EstadoHistorial.REGULAR},
    models.EstadoHistorial.LIBRE: {models.EstadoHistorial.CURSANDO, models.EstadoHistorial.REGULAR},
}


@router.get("/me", response_model=schemas.UsuarioOut)
def leer_alumno_actual(current_user: models.Usuario = Depends(get_current_user)):
    return current_user


@router.put("/me/historial", response_model=schemas.HistorialOut)
def actualizar_historial(
    datos: schemas.HistorialUpdate,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    materia = db.query(models.Materia).filter(models.Materia.id == datos.materia_id).first()
    if not materia:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La materia no existe")

    registro = (
        db.query(models.HistorialAcademico)
        .filter_by(alumno_id=current_user.id, materia_id=materia.id)
        .first()
    )
    estado_actual = registro.estado if registro else None
    nuevo_estado = datos.estado

    if estado_actual == models.EstadoHistorial.APROBADA:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "La materia ya está aprobada, no se puede modificar"
        )

    if estado_actual not in _ORIGENES_VALIDOS[nuevo_estado]:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"No se puede pasar de '{estado_actual.value if estado_actual else 'sin cursar'}' "
            f"a '{nuevo_estado.value}'",
        )

    if nuevo_estado == models.EstadoHistorial.CURSANDO:
        estados = {n["materia_id"]: n for n in grafo.calcular_estados(db, current_user.id)}
        if estados[materia.id]["estado"] == "bloqueada":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "No cumplís las correlatividades para cursar esta materia",
            )

    elif nuevo_estado == models.EstadoHistorial.APROBADA:
        if datos.nota is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Hace falta indicar la nota para aprobar")
        # Aplica igual si viene de "regular" (rindió el final) o de
        # "cursando" (promoción directa): en los dos casos hace falta
        # cumplir las correlatividades tipo FINAL.
        if not grafo.puede_aprobar(db, current_user.id, materia.id):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Todavía no cumplís las correlatividades para aprobar esta materia",
            )

    if registro:
        registro.estado = nuevo_estado
        registro.nota = datos.nota
    else:
        registro = models.HistorialAcademico(
            alumno_id=current_user.id,
            materia_id=materia.id,
            estado=nuevo_estado,
            nota=datos.nota,
        )
        db.add(registro)

    db.commit()
    db.refresh(registro)
    return registro


@router.delete("/me/historial/{materia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_historial(
    materia_id: int,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deshace la carga de una materia (vuelve a "sin cursar"), sin
    importar en que estado esté -- incluida una ya aprobada. ProyectAR
    no reemplaza al SIU-Guaraní: es la herramienta de seguimiento del
    propio alumno, no el registro oficial, así que si se equivocó al
    cargar algo la corrección es borrar y volver a cargarlo bien.
    """
    registro = (
        db.query(models.HistorialAcademico)
        .filter_by(alumno_id=current_user.id, materia_id=materia_id)
        .first()
    )
    if not registro:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "No tenés un registro cargado para esa materia"
        )
    db.delete(registro)
    db.commit()


@router.get("/me/dashboard", response_model=schemas.DashboardResponse)
def dashboard(
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    estados = grafo.calcular_estados(db, current_user.id)
    total = len(estados)
    aprobadas = sum(1 for e in estados if e["estado"] == "aprobada")
    cursando = sum(1 for e in estados if e["estado"] == "cursando")
    regulares = sum(1 for e in estados if e["estado"] == "regular")
    porcentaje_avance = round(aprobadas / total * 100, 1) if total else 0.0

    notas = (
        db.query(models.HistorialAcademico.nota)
        .filter(
            models.HistorialAcademico.alumno_id == current_user.id,
            models.HistorialAcademico.estado == models.EstadoHistorial.APROBADA,
            models.HistorialAcademico.nota.isnot(None),
        )
        .all()
    )
    valores = [n[0] for n in notas]
    promedio = round(sum(valores) / len(valores), 2) if valores else None

    return schemas.DashboardResponse(
        total_materias=total,
        aprobadas=aprobadas,
        cursando=cursando,
        regulares=regulares,
        porcentaje_avance=porcentaje_avance,
        promedio=promedio,
    )
