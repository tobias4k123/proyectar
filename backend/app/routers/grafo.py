from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import grafo, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(tags=["Grafo"])


@router.get("/grafo", response_model=schemas.GrafoResponse)
def obtener_grafo(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return schemas.GrafoResponse(
        nodos=grafo.calcular_estados(db, current_user.id),
        aristas=grafo.listar_aristas(db),
    )
