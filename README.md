# ProyectAR — Sistema de Gestión de Éxito Académico

ProyectAR modela el plan de estudios de la **Tecnicatura en Análisis de Sistemas** (Plan 634, Resolución 1328, IFES Neuquén) como un grafo dirigido: cada materia es un nodo y cada correlatividad es una arista. A partir del historial del alumno calcula en tiempo real qué materias puede cursar, cuáles están bloqueadas y cuál es la **ruta crítica** hacia el egreso, y permite **simular** escenarios ("¿y si apruebo estas materias?") sin tocar el historial real.

Proyecto final de *Prácticas Profesionalizantes II* — IFES Neuquén. Integrantes: Jeremías Velasco, Dante Nicolás Mercado, Tobías Piflacs. Docente: Prof. Silvia Hoferek.

> ProyectAR es una herramienta de seguimiento personal: **no reemplaza al SIU-Guaraní** ni es el registro académico oficial.

## Qué incluye

| Para el alumno | Para el administrador |
|---|---|
| Registro, login y logout (JWT) | Alta, edición y baja de materias |
| **Plan de estudios**: grafo interactivo con el estado de cada materia (aprobada, regular, cursando, disponible, bloqueada) y modo foco para ver las dependencias de una materia | Alta y baja de correlatividades (tipo *cursar*/*final*, requiere *cursada*/*aprobada*) |
| **Historial académico**: cargar y corregir el estado y la nota de cada materia | Validación de integridad: rechaza correlatividades que cerrarían una dependencia circular |
| **Dashboard**: porcentaje de avance, promedio y conteos por estado | Acceso restringido por rol (el resto de los usuarios recibe 403) |
| **Ruta crítica** y **simulador** de escenarios | |

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose v2).
- Git.

No hace falta instalar Python, Node ni PostgreSQL: todo corre en contenedores.

## Puesta en marcha (menos de 5 minutos)

```bash
# 1. Clonar y entrar
git clone https://github.com/tobias4k123/proyectar.git
cd proyectar

# 2. Construir y levantar los tres servicios (base de datos, backend, frontend)
docker compose up --build -d

# 3. Crear las tablas
docker compose exec backend alembic upgrade head

# 4. Cargar el plan de estudios real (23 materias, 45 correlatividades)
docker compose exec backend python -m app.seed_plan_estudios
```

> Si el paso 3 falla con `connection refused`, la base de datos todavía estaba arrancando: esperá unos segundos y repetilo.

Listo. Abrí **http://localhost:3000**, tocá *Registrate* y creá tu cuenta.

| Servicio | URL |
|---|---|
| Aplicación (frontend) | http://localhost:3000 |
| API (backend) | http://localhost:8000 |
| Documentación de la API (Swagger UI) | http://localhost:8000/docs |
| PostgreSQL (desde tu máquina) | `localhost:5433` — usuario `proyectar_user`, base `proyectar_db` |

Para ver los logs: `docker compose logs -f`. Para apagar todo: `docker compose down`.

## Crear el primer administrador

`/auth/register` siempre crea cuentas de **alumno** (a propósito: nadie puede asignarse permisos de administrador desde la API). Para tener un administrador, registrá la cuenta normalmente desde la aplicación y después promovela:

```bash
docker compose exec backend python -m app.promover_admin tu_correo@ejemplo.com
```

El cambio es inmediato, sin volver a iniciar sesión (el rol se lee de la base en cada request). Al recargar, aparece el link **Administración** en el menú. El script es idempotente: correrlo de nuevo no hace nada.

## Tests y calidad

```bash
docker compose exec backend pytest -v
```

La suite (57 tests, `backend/tests/`) cubre autenticación y control de rol, la máquina de estados del historial, el cálculo del grafo, la ruta crítica, el simulador y la administración del plan, incluyendo casos borde. Usa su propia base SQLite en memoria, así que no toca los datos del contenedor de PostgreSQL.

GitHub Actions ejecuta `pytest`, el lint (`oxlint`) y el build del frontend en cada Pull Request hacia `main` (`.github/workflows/ci.yml`).

**Medición de rendimiento** (RNF-01, objetivo < 500 ms):

```bash
docker compose exec backend python -m app.medir_rendimiento
```

Con el plan real sobre PostgreSQL en Docker, el peor p95 medido fue de 73 ms.

## Arquitectura

```
proyectar/
├── docker-compose.yml        # db (PostgreSQL 15) + backend + frontend
├── backend/                  # API REST — Python 3.11, FastAPI
│   ├── app/
│   │   ├── main.py           # aplicación y CORS
│   │   ├── models.py         # Usuario, Materia, Correlatividad, HistorialAcademico
│   │   ├── grafo.py          # grafo (NetworkX): estados, ruta crítica, simulación
│   │   ├── routers/          # auth, alumnos, grafo, admin
│   │   ├── seed_plan_estudios.py   # carga del Plan 634
│   │   ├── promover_admin.py       # promueve un usuario a administrador
│   │   └── medir_rendimiento.py    # medición de tiempos de respuesta
│   ├── alembic/              # migraciones
│   └── tests/                # suite de pytest
└── frontend/                 # React 19 + Vite
    └── src/
        ├── pages/            # Dashboard, PlanDeEstudios, Historial, RutaCritica, Admin, Login, Register
        ├── components/       # grafo (React Flow), rutas protegidas, pantallas de administración
        ├── store/            # sesión (Zustand)
        └── lib/              # cliente de la API, layout del grafo, estados
```

**Stack:** FastAPI · SQLAlchemy · Alembic · PostgreSQL · NetworkX · JWT (python-jose) · bcrypt (costo 12) · React · React Router · TanStack Query · Zustand · React Flow · Tailwind CSS · Docker Compose.

### Variables de entorno

Las define `docker-compose.yml` para el backend y el frontend:

| Variable | Servicio | Descripción |
|---|---|---|
| `DATABASE_URL` | backend | Cadena de conexión a PostgreSQL (apunta al contenedor `db`) |
| `SECRET_KEY` | backend | Clave con la que se firman los JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | Duración del token (60 por defecto) |
| `VITE_API_URL` | frontend | URL de la API que usa el navegador (`http://localhost:8000`) |

> **Atención:** los valores de `docker-compose.yml` son **solo para desarrollo**. En un despliegue real, `SECRET_KEY` y las credenciales de la base van en un `.env` que no se versiona.

### API

La referencia completa e interactiva está en http://localhost:8000/docs. Resumen:

| Grupo | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Alumno | `GET /alumnos/me`, `PUT /alumnos/me/historial`, `DELETE /alumnos/me/historial/{materia_id}`, `GET /alumnos/me/dashboard` |
| Grafo | `GET /grafo`, `GET /grafo/ruta-critica`, `GET /grafo/simulacion` |
| Administración (solo rol admin) | `GET/POST /admin/materias`, `PUT/DELETE /admin/materias/{id}`, `GET/POST /admin/correlatividades`, `DELETE /admin/correlatividades/{id}` |

Rutas sin token → `401`. Rutas de administración con un usuario alumno → `403`.

## Problemas frecuentes

- **Hice un cambio en el frontend y no se ve.** Con el proyecto en un volumen montado desde Windows, el hot-reload a veces no se entera de los cambios. Probá `docker compose down && docker compose up --build -d` antes de sospechar del código.
- **El puerto 3000, 8000 o 5433 está ocupado.** Cerrá el programa que lo usa o cambiá el puerto de la izquierda en `docker-compose.yml` (por ejemplo `"3001:5173"`).
- **Quiero empezar de cero con la base de datos.** `docker compose down -v` borra los contenedores **y todos los datos**; después repetí los pasos 2 a 4.
- **Cambié los modelos y necesito una migración nueva.** `docker compose exec backend alembic revision --autogenerate -m "descripcion"` y luego `alembic upgrade head`.
- **Git marca archivos como modificados sin que los haya tocado.** Es un tema de fin de línea (Windows); el repo incluye un `.gitattributes` que lo normaliza. Si persiste, hacé `git add --renormalize .` y revisá `git status`.

## Trabajo en equipo

Cada integrante levanta su **propio** entorno con `docker compose`, por lo que cada uno tiene su propia base de datos local: los usuarios y los cambios hechos desde las herramientas de administración no se comparten entre máquinas por `git pull` (viaja el código, no los datos). Para compartir datos, todos deberían apuntar `DATABASE_URL` a una misma instancia de PostgreSQL accesible por red.

El flujo de trabajo es una rama por cambio y Pull Request hacia `main`; el CI debe estar en verde antes de mergear.

## Documentación adicional

- [Protocolo de la prueba de usabilidad](docs/prueba-de-usabilidad.md) (RNF-04).
