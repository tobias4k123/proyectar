import networkx as nx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from .auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------- CU-06: Materias ----------


@router.get("/materias", response_model=list[schemas.MateriaOut])
def listar_materias(
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Materia)
        .order_by(models.Materia.anio_carrera, models.Materia.codigo)
        .all()
    )


@router.post("/materias", response_model=schemas.MateriaOut, status_code=status.HTTP_201_CREATED)
def crear_materia(
    datos: schemas.MateriaCreate,
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if db.query(models.Materia).filter(models.Materia.codigo == datos.codigo).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una materia con ese código")
    if db.query(models.Materia).filter(models.Materia.nombre == datos.nombre).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una materia con ese nombre")

    materia = models.Materia(**datos.model_dump())
    db.add(materia)
    db.commit()
    db.refresh(materia)
    return materia


@router.put("/materias/{materia_id}", response_model=schemas.MateriaOut)
def actualizar_materia(
    materia_id: int,
    datos: schemas.MateriaUpdate,
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    materia = db.query(models.Materia).filter(models.Materia.id == materia_id).first()
    if not materia:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La materia no existe")

    duplicado_codigo = (
        db.query(models.Materia)
        .filter(models.Materia.codigo == datos.codigo, models.Materia.id != materia_id)
        .first()
    )
    if duplicado_codigo:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe otra materia con ese código")

    duplicado_nombre = (
        db.query(models.Materia)
        .filter(models.Materia.nombre == datos.nombre, models.Materia.id != materia_id)
        .first()
    )
    if duplicado_nombre:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe otra materia con ese nombre")

    materia.codigo = datos.codigo
    materia.nombre = datos.nombre
    materia.anio_carrera = datos.anio_carrera
    db.commit()
    db.refresh(materia)
    return materia


@router.delete("/materias/{materia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_materia(
    materia_id: int,
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    materia = db.query(models.Materia).filter(models.Materia.id == materia_id).first()
    if not materia:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La materia no existe")

    # Si otra materia la tiene como correlativa (es decir, "materia" es
    # prerequisito de otra) no se puede borrar sin dejar esa
    # correlatividad huérfana -- el cascade del modelo solo cubre sus
    # PROPIAS correlatividades (donde "materia" es la que exige algo),
    # no las que otras materias le exigen a ella.
    la_requieren = (
        db.query(models.Correlatividad)
        .filter(models.Correlatividad.correlativa_id == materia_id)
        .first()
    )
    if la_requieren:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "No se puede borrar: otras materias la tienen como correlativa. "
            "Borrá esas correlatividades primero.",
        )

    tiene_historial = (
        db.query(models.HistorialAcademico)
        .filter(models.HistorialAcademico.materia_id == materia_id)
        .first()
    )
    if tiene_historial:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "No se puede borrar: hay alumnos con historial cargado para esta materia.",
        )

    db.delete(materia)  # cascade borra sus propias correlatividades (donde es materia_id)
    db.commit()


# ---------- CU-07: Correlatividades ----------


def _crearia_ciclo(db: Session, materia_id: int, correlativa_id: int) -> bool:
    """
    True si agregar la arista correlativa_id -> materia_id (la relacion
    de dependencia: "correlativa_id" prerequisito de "materia_id")
    cerraria un ciclo -- es decir, si "materia_id" ya es (directa o
    transitivamente) prerequisito de "correlativa_id". Se ignora a
    propósito el `tipo`/`requiere`: una dependencia circular es un
    problema estructural sin importar si las aristas involucradas son
    de cursada o de final.
    """
    G = nx.DiGraph()
    for c in db.query(models.Correlatividad).all():
        G.add_edge(c.correlativa_id, c.materia_id)
    if not G.has_node(materia_id):
        return False
    return nx.has_path(G, materia_id, correlativa_id)


@router.get("/correlatividades", response_model=list[schemas.CorrelatividadOut])
def listar_correlatividades(
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.Correlatividad).all()


@router.post(
    "/correlatividades",
    response_model=schemas.CorrelatividadOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_correlatividad(
    datos: schemas.CorrelatividadCreate,
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if datos.materia_id == datos.correlativa_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Una materia no puede ser correlativa de sí misma"
        )

    materia = db.query(models.Materia).filter(models.Materia.id == datos.materia_id).first()
    if not materia:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La materia no existe")
    correlativa = (
        db.query(models.Materia).filter(models.Materia.id == datos.correlativa_id).first()
    )
    if not correlativa:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La materia correlativa no existe")

    ya_existe = (
        db.query(models.Correlatividad)
        .filter_by(
            materia_id=datos.materia_id,
            correlativa_id=datos.correlativa_id,
            tipo=datos.tipo,
        )
        .first()
    )
    if ya_existe:
        raise HTTPException(status.HTTP_409_CONFLICT, "Esa correlatividad ya existe")

    if _crearia_ciclo(db, datos.materia_id, datos.correlativa_id):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Esto crearía una dependencia circular: '{correlativa.nombre}' ya depende "
            f"(directa o indirectamente) de '{materia.nombre}'",
        )

    correlatividad = models.Correlatividad(**datos.model_dump())
    db.add(correlatividad)
    db.commit()
    db.refresh(correlatividad)
    return correlatividad


@router.delete("/correlatividades/{correlatividad_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_correlatividad(
    correlatividad_id: int,
    current_admin: models.Usuario = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    correlatividad = (
        db.query(models.Correlatividad)
        .filter(models.Correlatividad.id == correlatividad_id)
        .first()
    )
    if not correlatividad:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La correlatividad no existe")
    db.delete(correlatividad)
    db.commit()
