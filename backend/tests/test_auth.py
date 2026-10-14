"""CU-01/CU-05: registro, login, logout, /auth/me y control de rol."""
from app import models


def test_registro_nominal(client):
    r = client.post(
        "/auth/register",
        json={"nombre": "Nueva Persona", "email": "nueva@test.com", "password": "clave123"},
    )
    assert r.status_code == 201, r.text
    cuerpo = r.json()
    assert cuerpo["email"] == "nueva@test.com"
    # /auth/register siempre crea alumnos -- no hay forma de autoasignarse admin.
    assert cuerpo["rol"] == "alumno"
    assert "password" not in cuerpo


def test_registro_email_duplicado(client, crear_usuario):
    crear_usuario("ya-existe@test.com")
    r = client.post(
        "/auth/register",
        json={"nombre": "Otra Persona", "email": "ya-existe@test.com", "password": "clave123"},
    )
    assert r.status_code == 400


def test_login_nominal(client, crear_usuario):
    crear_usuario("alumno@test.com", password="clave123")
    r = client.post("/auth/login", data={"username": "alumno@test.com", "password": "clave123"})
    assert r.status_code == 200, r.text
    assert "access_token" in r.json()


def test_login_password_incorrecta(client, crear_usuario):
    crear_usuario("alumno@test.com", password="clave123")
    r = client.post("/auth/login", data={"username": "alumno@test.com", "password": "mala"})
    assert r.status_code == 401


def test_login_usuario_inexistente(client):
    r = client.post("/auth/login", data={"username": "no-existe@test.com", "password": "clave123"})
    assert r.status_code == 401


def test_me_sin_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_con_token(client, crear_usuario, headers_de):
    crear_usuario("alumno@test.com")
    r = client.get("/auth/me", headers=headers_de("alumno@test.com"))
    assert r.status_code == 200
    assert r.json()["email"] == "alumno@test.com"


def test_logout_requiere_token(client):
    r = client.post("/auth/logout")
    assert r.status_code == 401


def test_logout_con_token(client, crear_usuario, headers_de):
    crear_usuario("alumno@test.com")
    r = client.post("/auth/logout", headers=headers_de("alumno@test.com"))
    assert r.status_code == 200


def test_token_invalido_o_corrupto(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer esto-no-es-un-jwt"})
    assert r.status_code == 401


def test_control_de_rol_alumno_no_accede_a_admin(client, crear_usuario, headers_de):
    crear_usuario("alumno@test.com", rol=models.RolEnum.ALUMNO)
    r = client.get("/admin/materias", headers=headers_de("alumno@test.com"))
    assert r.status_code == 403


def test_control_de_rol_admin_si_accede(client, crear_usuario, headers_de):
    crear_usuario("admin@test.com", rol=models.RolEnum.ADMIN)
    r = client.get("/admin/materias", headers=headers_de("admin@test.com"))
    assert r.status_code == 200


def test_control_de_rol_sin_token(client):
    r = client.get("/admin/materias")
    assert r.status_code == 401
