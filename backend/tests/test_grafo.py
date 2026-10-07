"""CU-02/CU-04: grafo de correlatividades, ruta crítica y modo simulación."""


def _materia(grafo, materia_id):
    return next(n for n in grafo["nodos"] if n["materia_id"] == materia_id)


def test_grafo_sin_historial_todo_bloqueado_salvo_la_raiz(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    r = client.get("/grafo", headers=headers_de("alumno@test.com"))
    assert r.status_code == 200
    grafo = r.json()
    assert _materia(grafo, materias_basicas["m1"])["estado"] == "disponible"
    assert _materia(grafo, materias_basicas["m2"])["estado"] == "bloqueada"
    assert _materia(grafo, materias_basicas["m3"])["estado"] == "bloqueada"
    # dos aristas entre M1 y M2 (cursar + final) más una entre M2 y M3
    assert len(grafo["aristas"]) == 3


def test_puede_promocionar_cuando_cumple_correlativas_finales(
    client, crear_usuario, headers_de, materias_basicas
):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    grafo = client.get("/grafo", headers=headers).json()
    nodo = _materia(grafo, materias_basicas["m1"])
    assert nodo["estado"] == "cursando"
    # M1 no tiene correlativas de tipo FINAL -- siempre puede promocionar.
    assert nodo["puede_promocionar"] is True


def test_no_puede_rendir_final_sin_la_correlativa_aprobada(
    client, crear_usuario, headers_de, materias_basicas
):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    for estado in ("cursando", "regular"):
        client.put(
            "/alumnos/me/historial",
            json={"materia_id": materias_basicas["m1"], "estado": estado},
            headers=headers,
        )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m2"], "estado": "cursando"},
        headers=headers,
    )
    grafo = client.get("/grafo", headers=headers).json()
    assert _materia(grafo, materias_basicas["m2"])["puede_promocionar"] is False


def test_ruta_critica_nominal(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    r = client.get("/grafo/ruta-critica", headers=headers_de("alumno@test.com"))
    assert r.status_code == 200
    cuerpo = r.json()
    assert cuerpo["longitud"] == 3
    assert [m["materia_id"] for m in cuerpo["materias"]] == [
        materias_basicas["m1"],
        materias_basicas["m2"],
        materias_basicas["m3"],
    ]


def test_ruta_critica_se_achica_al_aprobar(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "cursando"},
        headers=headers,
    )
    client.put(
        "/alumnos/me/historial",
        json={"materia_id": materias_basicas["m1"], "estado": "aprobada", "nota": 7},
        headers=headers,
    )
    r = client.get("/grafo/ruta-critica", headers=headers)
    cuerpo = r.json()
    assert cuerpo["longitud"] == 2
    assert materias_basicas["m1"] not in [m["materia_id"] for m in cuerpo["materias"]]


def test_simulacion_no_persiste_nada(client, crear_usuario, headers_de, materias_basicas):
    crear_usuario("alumno@test.com")
    headers = headers_de("alumno@test.com")
    r = client.get(
        "/grafo/simulacion",
        params={"materias_aprobadas": [materias_basicas["m1"]]},
        headers=headers,
    )
    assert r.status_code == 200
    cuerpo = r.json()
    nodo_simulado = _materia(cuerpo, materias_basicas["m1"])
    assert nodo_simulado["estado"] == "aprobada"
    assert nodo_simulado["simulado"] is True
    # la ruta crítica recalculada ya no debería incluir la materia "aprobada de mentira"
    assert materias_basicas["m1"] not in [m["materia_id"] for m in cuerpo["ruta_critica"]]

    # el grafo real, sin el parámetro de simulación, no cambió
    grafo_real = client.get("/grafo", headers=headers).json()
    assert _materia(grafo_real, materias_basicas["m1"])["estado"] == "disponible"
    assert _materia(grafo_real, materias_basicas["m1"])["simulado"] is False


def test_simulacion_materia_inexistente(client, crear_usuario, headers_de):
    crear_usuario("alumno@test.com")
    r = client.get(
        "/grafo/simulacion",
        params={"materias_aprobadas": [9999]},
        headers=headers_de("alumno@test.com"),
    )
    assert r.status_code == 404


def test_grafo_requiere_autenticacion(client):
    assert client.get("/grafo").status_code == 401
    assert client.get("/grafo/ruta-critica").status_code == 401
    assert client.get("/grafo/simulacion").status_code == 401
