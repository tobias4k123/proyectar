from pydantic import BaseModel, EmailStr, Field

from .models import EstadoHistorial, RolEnum


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

class HistorialUpdate(BaseModel):
    materia_id: int
    estado: EstadoHistorial
    nota: int | None = Field(default=None, ge=1, le=10)


class HistorialOut(BaseModel):
    materia_id: int
    estado: EstadoHistorial
    nota: int | None = None

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    total_materias: int
    aprobadas: int
    cursando: int
    regulares: int
    porcentaje_avance: float
    promedio: float | None = None
