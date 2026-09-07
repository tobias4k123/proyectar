from pydantic import BaseModel, EmailStr

from .models import RolEnum


class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: RolEnum

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MateriaEstado(BaseModel):
    materia_id: int
    codigo: str
    nombre: str
    anio_carrera: int
    estado: str
    puede_rendir_final: bool | None = None


class AristaGrafo(BaseModel):
    origen_id: int
    destino_id: int
    tipo: str
    requiere: str


class GrafoResponse(BaseModel):
    nodos: list[MateriaEstado]
    aristas: list[AristaGrafo]
