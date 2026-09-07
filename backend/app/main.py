from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth

# Inicializamos la aplicación
app = FastAPI(title="ProyectAR API", version="1.0")

# Permite que el frontend (Vite, corriendo en otro origen) llame a esta API.
# Se agregan tanto el puerto mapeado por docker-compose (3000) como el puerto
# por defecto de Vite (5173) para cuando el frontend corre fuera de Docker.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


# Creamos nuestra primera ruta
@app.get("/")
def read_root():
    return {"mensaje": "¡Hola, ProyectAR! El backend está funcionando perfectamente."}