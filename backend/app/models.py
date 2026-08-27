from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Table
from sqlalchemy.orm import relationship
from .database import Base
import enum

# Definimos roles para los usuarios
class RolEnum(enum.Enum):
    ADMIN = "admin"
    ALUMNO = "alumno"

# Tabla intermedia para las Correlatividades de las Materias (Muchos a Muchos)
materia_correlativa = Table(
    'materia_correlativa',
    Base.metadata,
    Column('materia_id', Integer, ForeignKey('materias.id'), primary_key=True),
    Column('correlativa_id', Integer, ForeignKey('materias.id'), primary_key=True)
)

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) # Aquí guardaremos la contraseña (idealmente hasheada)
    rol = Column(Enum(RolEnum), default=RolEnum.ALUMNO, nullable=False)

    # Relación con el historial académico
    historial = relationship("HistorialAcademico", back_populates="alumno")


class Materia(Base):
    __tablename__ = "materias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)
    anio_carrera = Column(Integer, nullable=False) # Año en el que se cursa (1°, 2°, etc.)

    # Relación de correlatividades (materias que requiere para cursar)
    correlativas = relationship(
        "Materia",
        secondary=materia_correlativa,
        primaryjoin=id==materia_correlativa.c.materia_id,
        secondaryjoin=id==materia_correlativa.c.correlativa_id,
        backref="es_correlativa_de"
    )


class HistorialAcademico(Base):
    __tablename__ = "historial_academico"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id"), nullable=False)
    estado = Column(String, nullable=False) # Ej: "Cursando", "Aprobado", "Libre"
    nota = Column(Integer, nullable=True)

    # Relaciones
    alumno = relationship("Usuario", back_populates="historial")
    materia = relationship("Materia")