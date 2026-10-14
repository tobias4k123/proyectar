"""
Mide el tiempo de respuesta de los endpoints del grafo contra el RNF-01
del informe (< 500 ms para GET /grafo con el plan de estudios real).

Uso (con los contenedores corriendo y el plan ya cargado con
`python -m app.seed_plan_estudios`):
    docker compose exec backend python -m app.medir_rendimiento

Crea (o reutiliza) un alumno de prueba `rendimiento@example.com`, le
carga unas materias aprobadas para que el cálculo no sea trivial, y mide
cada endpoint N veces con HTTP real (el login queda fuera de la
medición). Solo usa la librería estándar -- no necesita dependencias extra.

Se puede apuntar a otra URL con la variable de entorno API_URL.
"""
import json
import os
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request

API_URL = os.environ.get("API_URL", "http://localhost:8000")
EMAIL = "rendimiento@example.com"
PASSWORD = "clave-de-prueba-123"
LIMITE_MS = 500  # RNF-01
REPETICIONES = 200


def pedir(ruta, metodo="GET", datos=None, token=None, formulario=False):
    headers = {}
    cuerpo = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if datos is not None:
        if formulario:
            cuerpo = urllib.parse.urlencode(datos).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            cuerpo = json.dumps(datos).encode()
            headers["Content-Type"] = "application/json"
    req = urllib.request.Request(API_URL + ruta, data=cuerpo, headers=headers, method=metodo)
    with urllib.request.urlopen(req) as resp:
        crudo = resp.read()
        return json.loads(crudo) if crudo else None


def preparar_alumno():
    try:
        pedir("/auth/register", "POST", {"nombre": "Prueba Rendimiento", "email": EMAIL, "password": PASSWORD})
    except urllib.error.HTTPError as error:
        if error.code != 400:  # 400 = ya estaba registrado de una corrida anterior
            raise
    token = pedir("/auth/login", "POST", {"username": EMAIL, "password": PASSWORD}, formulario=True)["access_token"]

    grafo = pedir("/grafo", token=token)
    ids = {n["codigo"]: n["materia_id"] for n in grafo["nodos"]}
    estados = {n["codigo"]: n["estado"] for n in grafo["nodos"]}
    for codigo in ["634-01-01", "634-01-02", "634-01-03", "634-01-04", "634-01-05"]:
        if codigo not in ids or estados[codigo] == "aprobada":
            continue
        try:
            pedir("/alumnos/me/historial", "PUT", {"materia_id": ids[codigo], "estado": "cursando"}, token)
            pedir("/alumnos/me/historial", "PUT", {"materia_id": ids[codigo], "estado": "aprobada", "nota": 8}, token)
        except urllib.error.HTTPError:
            pass
    return token, ids, len(grafo["nodos"]), len(grafo["aristas"])


def medir(nombre, ruta, token):
    for _ in range(10):  # calentamiento, no cuenta
        pedir(ruta, token=token)
    tiempos = []
    for _ in range(REPETICIONES):
        t0 = time.perf_counter()
        pedir(ruta, token=token)
        tiempos.append((time.perf_counter() - t0) * 1000)
    tiempos.sort()
    p95 = tiempos[int(REPETICIONES * 0.95)]
    veredicto = "OK" if p95 < LIMITE_MS else "SUPERA EL LIMITE"
    print(
        f"{nombre:<26} media={statistics.mean(tiempos):7.1f} ms  "
        f"p95={p95:7.1f} ms  max={tiempos[-1]:7.1f} ms  [{veredicto}]"
    )
    return p95


def main():
    token, ids, n_nodos, n_aristas = preparar_alumno()
    print(f"Plan cargado: {n_nodos} materias, {n_aristas} aristas. {REPETICIONES} mediciones por endpoint.\n")
    simulacion = "/grafo/simulacion?" + "&".join(
        f"materias_aprobadas={ids[c]}" for c in ("634-01-06", "634-01-07") if c in ids
    )
    p95s = [
        medir("GET /grafo", "/grafo", token),
        medir("GET /grafo/ruta-critica", "/grafo/ruta-critica", token),
        medir("GET /grafo/simulacion", simulacion, token),
        medir("GET /alumnos/me/dashboard", "/alumnos/me/dashboard", token),
    ]
    print(f"\nRNF-01 (< {LIMITE_MS} ms): {'CUMPLE' if max(p95s) < LIMITE_MS else 'NO CUMPLE'}")


if __name__ == "__main__":
    main()
