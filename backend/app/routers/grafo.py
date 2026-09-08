from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import grafo, models, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(tags=["Grafo"])


@router.get("/grafo", response_model=schemas.GrafoResponse)
def obtener_grafo(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return schemas.GrafoResponse(
        nodos=grafo.calcular_estados(db, current_user.id),
        aristas=grafo.listar_aristas(db),
    )


@router.get("/grafo/ruta-critica", response_model=schemas.RutaCriticaResponse)
def obtener_ruta_critica(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    materias = grafo.calcular_ruta_critica(db, current_user.id)
    return schemas.RutaCriticaResponse(longitud=len(materias), materias=materias)


def _validar_materias_existentes(db: Session, materia_ids: list[int]) -> None:
    if not materia_ids:
        return
    existentes = {
        m.id
        for m in db.query(models.Materia.id).filter(models.Materia.id.in_(materia_ids)).all()
    }
    faltantes = set(materia_ids) - existentes
    if faltantes:
        raise HTTPException(404, f"No existen las materias: {sorted(faltantes)}")


@router.get("/grafo/simulacion", response_model=schemas.SimulacionResponse)
def simular_grafo(
    materias_aprobadas: list[int] = Query(
        default=[],
        description="IDs de materias a considerar aprobadas 'de mentira', sin tocar el historial real.",
    ),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validar_materias_existentes(db, materias_aprobadas)
    simulacion = set(materias_aprobadas)

    return schemas.SimulacionResponse(
        nodos=grafo.calcular_estados(db, current_user.id, simulacion_aprobadas=simulacion),
        aristas=grafo.listar_aristas(db),
        ruta_critica=grafo.calcular_ruta_critica(
            db, current_user.id, simulacion_aprobadas=simulacion
        ),
    )
