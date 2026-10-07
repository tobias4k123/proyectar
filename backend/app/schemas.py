from pydantic import BaseModel, EmailStr, Field

from .models import EstadoHistorial, RolEnum, RequisitoEnum, TipoCorrelatividad


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
    nota: int | None = None
    puede_rendir_final: bool | None = None
    puede_promocionar: bool | None = None
    simulado: bool = False


class AristaGrafo(BaseModel):
    origen_id: int
    destino_id: int
    tipo: str
    requiere: str


class GrafoResponse(BaseModel):
    nodos: list[MateriaEstado]
    aristas: list[AristaGrafo]


class RutaCriticaResponse(BaseModel):
    longitud: int
    materias: list[MateriaEstado]


class SimulacionResponse(BaseModel):
    nodos: list[MateriaEstado]
    aristas: list[AristaGrafo]
    ruta_critica: list[MateriaEstado]

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


# ---------- Admin: materias y correlatividades (CU-06 / CU-07) ----------


class MateriaCreate(BaseModel):
    codigo: str = Field(min_length=1)
    nombre: str = Field(min_length=1)
    anio_carrera: int = Field(ge=1)


class MateriaUpdate(BaseModel):
    codigo: str = Field(min_length=1)
    nombre: str = Field(min_length=1)
    anio_carrera: int = Field(ge=1)


class MateriaOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    anio_carrera: int

    class Config:
        from_attributes = True


class CorrelatividadCreate(BaseModel):
    materia_id: int
    correlativa_id: int
    tipo: TipoCorrelatividad
    requiere: RequisitoEnum


class CorrelatividadOut(BaseModel):
    id: int
    materia_id: int
    correlativa_id: int
    tipo: TipoCorrelatividad
    requiere: RequisitoEnum

    class Config:
        from_attributes = True
