"""
Fixtures compartidas por toda la suite.

Usa una base sqlite en memoria en vez de la Postgres real de Docker -- no
necesita contenedores levantados y cada test arranca de una base vacía.
Para que las rutas que llaman a get_db usen esta base de test en vez de la
real, se pisa la dependencia con `app.dependency_overrides` (el mecanismo
estándar de FastAPI para esto), sin tocar `app/database.py`.

`check_same_thread=False` + `StaticPool` son necesarios porque FastAPI
corre los endpoints sync (los que no son `async def`, que es el caso de
todo este backend) en un thread pool -- sin esto sqlite tira "objects
created in a thread can only be used in that same thread".
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, security
from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _base_limpia():
    """Tablas nuevas para cada test -- ningún test depende del orden ni deja basura."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    sesion = TestingSessionLocal()
    try:
        yield sesion
    finally:
        sesion.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def crear_usuario(db):
    """Crea un usuario directo en la base (sin pasar por /auth/register) para
    no depender del endpoint de registro en tests de otras cosas, y para
    poder crear admins (que /auth/register nunca crea a propósito)."""

    def _crear(email, password="clave123", rol=models.RolEnum.ALUMNO, nombre="Usuario de prueba"):
        usuario = models.Usuario(
            nombre=nombre,
            email=email,
            password=security.hash_password(password),
            rol=rol,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario

    return _crear


@pytest.fixture
def headers_de(client):
    """Devuelve el header Authorization ya logueado para un email/password."""

    def _headers(email, password="clave123"):
        r = client.post("/auth/login", data={"username": email, "password": password})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _headers


@pytest.fixture
def materias_basicas(db):
    """
    Cadena M1 -> M2 -> M3 (año 1, 1, 2) pensada para ejercitar las dos
    dimensiones de una correlatividad:
      - M2 necesita M1 CURSADA (regular o aprobada) para poder cursarse.
      - M2 necesita M1 APROBADA para poder aprobarse (rendir el final o
        promocionar).
      - M3 necesita M2 APROBADA para poder cursarse.
    Así alcanza para probar estados "disponible"/"bloqueada", puede_rendir_final/
    puede_promocionar, ruta crítica y simulación sin repetir las 23 materias
    reales del plan.
    """
    m1 = models.Materia(codigo="M1", nombre="Materia Uno", anio_carrera=1)
    m2 = models.Materia(codigo="M2", nombre="Materia Dos", anio_carrera=1)
    m3 = models.Materia(codigo="M3", nombre="Materia Tres", anio_carrera=2)
    db.add_all([m1, m2, m3])
    db.commit()

    db.add_all(
        [
            models.Correlatividad(
                materia_id=m2.id,
                correlativa_id=m1.id,
                tipo=models.TipoCorrelatividad.CURSAR,
                requiere=models.RequisitoEnum.CURSADA,
            ),
            models.Correlatividad(
                materia_id=m2.id,
                correlativa_id=m1.id,
                tipo=models.TipoCorrelatividad.FINAL,
                requiere=models.RequisitoEnum.APROBADA,
            ),
            models.Correlatividad(
                materia_id=m3.id,
                correlativa_id=m2.id,
                tipo=models.TipoCorrelatividad.CURSAR,
                requiere=models.RequisitoEnum.APROBADA,
            ),
        ]
    )
    db.commit()

    return {"m1": m1.id, "m2": m2.id, "m3": m3.id}
