from sqlalchemy import Column, Integer, String, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
import enum


class RolEnum(enum.Enum):
    ADMIN = "admin"
    ALUMNO = "alumno"


class TipoCorrelatividad(enum.Enum):
    CURSAR = "cursar"
    FINAL = "final"


class RequisitoEnum(enum.Enum):
    CURSADA = "cursada"
    APROBADA = "aprobada"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    rol = Column(Enum(RolEnum), default=RolEnum.ALUMNO, nullable=False)

    historial = relationship("HistorialAcademico", back_populates="alumno")


class Materia(Base):
    __tablename__ = "materias"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, unique=True, nullable=False)
    anio_carrera = Column(Integer, nullable=False)

    correlatividades = relationship(
        "Correlatividad",
        foreign_keys="Correlatividad.materia_id",
        back_populates="materia",
        cascade="all, delete-orphan",
    )


class Correlatividad(Base):
    """
    Representa UNA condicion de correlatividad: "para <tipo> la materia
    <materia_id> necesito tener <requiere> la materia <correlativa_id>".

    Reemplaza a la vieja tabla materia_correlativa (M2M simple) porque el
    plan real distingue "para cursar" de "para rendir el final", y
    "necesita cursada" de "necesita aprobada" -- una relacion M2M plana
    no puede representar esas dos dimensiones.
    """

    __tablename__ = "correlatividades"
    __table_args__ = (
        UniqueConstraint("materia_id", "correlativa_id", "tipo", name="uq_correlatividad"),
    )

    id = Column(Integer, primary_key=True, index=True)
    materia_id = Column(Integer, ForeignKey("materias.id"), nullable=False)
    correlativa_id = Column(Integer, ForeignKey("materias.id"), nullable=False)
    tipo = Column(Enum(TipoCorrelatividad), nullable=False)
    requiere = Column(Enum(RequisitoEnum), nullable=False)

    materia = relationship("Materia", foreign_keys=[materia_id], back_populates="correlatividades")
    correlativa = relationship("Materia", foreign_keys=[correlativa_id])


class HistorialAcademico(Base):
    __tablename__ = "historial_academico"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id"), nullable=False)
    estado = Column(String, nullable=False)
    nota = Column(Integer, nullable=True)

    alumno = relationship("Usuario", back_populates="historial")
    materia = relationship("Materia")
