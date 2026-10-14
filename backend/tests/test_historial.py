"""CU-03/CU-04: carga de historial académico, máquina de estados y dashboard."""


def test_cursar_materia_disponible(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    assert r.json()["estado"] == "cursando"


def test_cursar_materia_bloqueada(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    # M2 necesita M1 cursada -- sin haber tocado M1, tiene que rechazarla.
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m2"], "estado": "cursando"},
        headers=headers,
    )
    assert r.status_code == 400


def test_aprobar_sin_nota_falla(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada"},
        headers=headers,
    )
    assert r.status_code == 400


def test_promocion_directa_desde_cursando(client, crear_usuario, headers_de, materias_basicas):
    """En IFES toda materia es promocionable: cursando -> aprobada sin pasar por regular."""
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 8},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    assert r.json() == {"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 8}


def test_aprobar_sin_cumplir_correlativas_de_final(client, crear_usuario, headers_de, materias_basicas):
    """M2 pide M1 cursada para CURSARSE pero M1 aprobada para APROBARSE --
    cursar M2 debe andar, pero aprobarla antes de aprobar M1 no."""
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "regular"},
        headers=headers,
    )
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m2"], "estado": "cursando"},
        headers=headers,
    )
    assert r.status_code == 200, r.text

    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m2"], "estado": "aprobada", "nota": 7},
        headers=headers,
    )
    assert r.status_code == 400


def test_materia_aprobada_no_se_puede_modificar(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 9},
        headers=headers,
    )
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "libre"},
        headers=headers,
    )
    assert r.status_code == 409


def test_transicion_invalida(client, crear_usuario, headers_de, materias_basicas):
    """No se puede pasar directo de "sin cursar" a "regular"."""
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "regular"},
        headers=headers,
    )
    assert r.status_code == 400


def test_materia_inexistente(client, crear_usuario, headers_de):
    crear_usuario("alumno@test.com")
    r = client.put(
        "/alumnos/me/historial",
        json={"materia_id": 9999, "estado": "cursando"},
        headers=headers_de("alumno@test.com"),
    )
    assert r.status_code == 404


def test_corregir_carga_borra_el_registro(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    r = client.delete(f"/alumnos/me/historial/{materias_basicas['m1']}", headers=headers)
    assert r.status_code == 204

    # vuelve a estar disponible, como si nunca se hubiera cargado nada
    grafo = client.get("/grafo", headers=headers).json()
    nodo = next(n for n in grafo["nodos"] if n["materia_id"] == materias_basicas["m1"])
    assert nodo["estado"] == "disponible"


def test_corregir_carga_funciona_incluso_ya_aprobada(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 10},
        headers=headers,
    )
    r = client.delete(f"/alumnos/me/historial/{materias_basicas['m1']}", headers=headers)
    assert r.status_code == 204


def test_eliminar_historial_sin_registro(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    r = client.delete(
        f"/alumnos/me/historial/{materias_basicas['m1']}", headers=headers_de("alumno@test.com")
    )
    assert r.status_code == 404


def test_dashboard_alumno_recien_registrado(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    r = client.get("/alumnos/me/dashboard", headers=headers_de("alumno@test.com"))
    assert r.status_code == 200
    cuerpo = r.json()
    assert cuerpo["total_materias"] == 3
    assert cuerpo["aprobadas"] == 0
    assert cuerpo["porcentaje_avance"] == 0.0
    assert cuerpo["promedio"] is None  # nunca "0" ni "null" engañoso


def test_dashboard_con_una_materia_aprobada(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 8},
        headers=headers,
    )
    r = client.get("/alumnos/me/dashboard", headers=headers)
    cuerpo = r.json()
    assert cuerpo["aprobadas"] == 1
    assert cuerpo["porcentaje_avance"] == round(1 / 3 * 100, 1)
    assert cuerpo["promedio"] == 8.0
