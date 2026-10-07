"""CU-06/CU-07: administración de materias y correlatividades (solo admin)."""
import pytest

from app import models


@pytest.fixture
def admin_headers(crear_usuario, headers_de):
    crear_usuario("admin@test.com", rol=models.RolEnum.ADMIN)
    return headers_de("admin@test.com")


@pytest.fixture
def alumno_headers(crear_usuario, headers_de):
    crear_usuario("alumno@test.com", rol=models.RolEnum.ALUMNO)
    return headers_de("alumno@test.com")


@pytest.fixture
def cadena_abc(db):
    """A -> B -> C (A correlativa de B, B correlativa de C), para los tests de anti-ciclos."""
    a = models.Materia(codigo="A", nombre="Materia A", anio_carrera=1)
    b = models.Materia(codigo="B", nombre="Materia B", anio_carrera=1)
    c = models.Materia(codigo="C", nombre="Materia C", anio_carrera=2)
    db.add_all([a, b, c])
    db.commit()

    corr_ab = models.Correlatividad(
        materia_id=b.id, correlativa_id=a.id,
        tipo=models.TipoCorrelatividad.CURSAR, requiere=models.RequisitoEnum.APROBADA,
    )
    corr_bc = models.Correlatividad(
        materia_id=c.id, correlativa_id=b.id,
        tipo=models.TipoCorrelatividad.CURSAR, requiere=models.RequisitoEnum.APROBADA,
    )
    db.add_all([corr_ab, corr_bc])
    db.commit()

    return {"a": a.id, "b": b.id, "c": c.id, "corr_ab": corr_ab.id, "corr_bc": corr_bc.id}


# ---------- Control de rol ----------


def test_sin_token_401(client):
    assert client.get("/admin/materias").status_code == 401


def test_alumno_403_en_materias(client, alumno_headers):
    assert client.get("/admin/materias", headers=alumno_headers).status_code == 403
    assert (
        client.post(
            "/admin/materias", json={"codigo": "X", "nombre": "X", "anio_carrera": 1}, headers=alumno_headers
        ).status_code
        == 403
    )


def test_alumno_403_en_correlatividades(client, alumno_headers, cadena_abc):
    datos = {
        "materia_id": cadena_abc["a"],
        "correlativa_id": cadena_abc["b"],
        "tipo": "cursar",
        "requiere": "aprobada",
    }
    assert client.post("/admin/correlatividades", json=datos, headers=alumno_headers).status_code == 403


# ---------- CU-06: Materias ----------


def test_admin_lista_materias(client, admin_headers, cadena_abc):
    r = client.get("/admin/materias", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 3


def test_crear_materia_nominal(client, admin_headers):
    r = client.post(
        "/admin/materias", json={"codigo": "D", "nombre": "Materia D", "anio_carrera": 2}, headers=admin_headers
    )
    assert r.status_code == 201, r.text
    assert r.json()["codigo"] == "D"


def test_crear_materia_codigo_duplicado(client, admin_headers, cadena_abc):
    r = client.post(
        "/admin/materias", json={"codigo": "A", "nombre": "Otro nombre", "anio_carrera": 1}, headers=admin_headers
    )
    assert r.status_code == 409


def test_crear_materia_nombre_duplicado(client, admin_headers, cadena_abc):
    r = client.post(
        "/admin/materias", json={"codigo": "Z", "nombre": "Materia A", "anio_carrera": 1}, headers=admin_headers
    )
    assert r.status_code == 409


def test_actualizar_materia_nominal(client, admin_headers, cadena_abc):
    r = client.put(
        f"/admin/materias/{cadena_abc['a']}",
        json={"codigo": "A2", "nombre": "Materia A renombrada", "anio_carrera": 3},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"id": cadena_abc["a"], "codigo": "A2", "nombre": "Materia A renombrada", "anio_carrera": 3}


def test_actualizar_materia_inexistente(client, admin_headers):
    r = client.put(
        "/admin/materias/9999", json={"codigo": "X", "nombre": "X", "anio_carrera": 1}, headers=admin_headers
    )
    assert r.status_code == 404


def test_actualizar_a_codigo_de_otra_materia(client, admin_headers, cadena_abc):
    r = client.put(
        f"/admin/materias/{cadena_abc['a']}",
        json={"codigo": "B", "nombre": "Materia A", "anio_carrera": 1},
        headers=admin_headers,
    )
    assert r.status_code == 409


def test_borrar_materia_sin_dependencias(client, admin_headers):
    creada = client.post(
        "/admin/materias", json={"codigo": "D", "nombre": "Materia D", "anio_carrera": 2}, headers=admin_headers
    ).json()
    r = client.delete(f"/admin/materias/{creada['id']}", headers=admin_headers)
    assert r.status_code == 204


def test_borrar_materia_que_es_correlativa_de_otra(client, admin_headers, cadena_abc):
    r = client.delete(f"/admin/materias/{cadena_abc['a']}", headers=admin_headers)
    assert r.status_code == 409


def test_borrar_materia_con_historial_cargado(client, admin_headers, cadena_abc, crear_usuario, db):
    # Se inserta el historial directo en la base (en vez de pasar por el
    # endpoint del alumno) para no tener que cumplir las correlatividades de
    # "cadena_abc" -- lo que se quiere probar es el chequeo de admin.py, no
    # la máquina de estados de alumnos.py (eso ya se cubre en test_historial.py).
    alumno = crear_usuario("alumno@test.com")
    db.add(
        models.HistorialAcademico(
            alumno_id=alumno.id, materia_id=cadena_abc["c"], estado=models.EstadoHistorial.CURSANDO
        )
    )
    db.commit()

    r = client.delete(f"/admin/materias/{cadena_abc['c']}", headers=admin_headers)
    assert r.status_code == 409


def test_borrar_materia_inexistente(client, admin_headers):
    r = client.delete("/admin/materias/9999", headers=admin_headers)
    assert r.status_code == 404


# ---------- CU-07: Correlatividades ----------


def test_admin_lista_correlatividades(client, admin_headers, cadena_abc):
    r = client.get("/admin/correlatividades", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_correlatividad_autocorrelativa(client, admin_headers, cadena_abc):
    datos = {
        "materia_id": cadena_abc["a"],
        "correlativa_id": cadena_abc["a"],
        "tipo": "cursar",
        "requiere": "aprobada",
    }
    r = client.post("/admin/correlatividades", json=datos, headers=admin_headers)
    assert r.status_code == 400


def test_correlatividad_materia_inexistente(client, admin_headers, cadena_abc):
    datos = {
        "materia_id": 9999,
        "correlativa_id": cadena_abc["a"],
        "tipo": "cursar",
        "requiere": "aprobada",
    }
    r = client.post("/admin/correlatividades", json=datos, headers=admin_headers)
    assert r.status_code == 404


def test_correlatividad_duplicada(client, admin_headers, cadena_abc):
    datos = {
        "materia_id": cadena_abc["b"],
        "correlativa_id": cadena_abc["a"],
        "tipo": "cursar",
        "requiere": "aprobada",
    }
    r = client.post("/admin/correlatividades", json=datos, headers=admin_headers)
    assert r.status_code == 409


def test_correlatividad_crearia_ciclo(client, admin_headers, cadena_abc):
    """Sobre A -> B -> C ya cargada, pedir C -> A cerraría el ciclo."""
    datos = {
        "materia_id": cadena_abc["a"],
        "correlativa_id": cadena_abc["c"],
        "tipo": "final",
        "requiere": "aprobada",
    }
    r = client.post("/admin/correlatividades", json=datos, headers=admin_headers)
    assert r.status_code == 400
    assert "circular" in r.json()["detail"].lower()


def test_correlatividad_consistente_no_es_ciclo(client, admin_headers, cadena_abc):
    """A -> C directa es consistente con la cadena A -> B -> C existente, no es un ciclo."""
    datos = {
        "materia_id": cadena_abc["c"],
        "correlativa_id": cadena_abc["a"],
        "tipo": "final",
        "requiere": "aprobada",
    }
    r = client.post("/admin/correlatividades", json=datos, headers=admin_headers)
    assert r.status_code == 201, r.text


def test_borrar_correlatividad_nominal(client, admin_headers, cadena_abc):
    r = client.delete(f"/admin/correlatividades/{cadena_abc['corr_ab']}", headers=admin_headers)
    assert r.status_code == 204


def test_borrar_correlatividad_inexistente(client, admin_headers):
    r = client.delete("/admin/correlatividades/9999", headers=admin_headers)
    assert r.status_code == 404


# ---------- Regresión: nada de esto afecta a un alumno normal ----------


def test_sin_regresion_en_grafo_y_me(client, admin_headers, alumno_headers, cadena_abc):
    assert client.get("/grafo", headers=alumno_headers).status_code == 200
    r_alumno = client.get("/auth/me", headers=alumno_headers)
    assert r_alumno.json()["rol"] == "alumno"
    r_admin = client.get("/auth/me", headers=admin_headers)
    assert r_admin.json()["rol"] == "admin"
