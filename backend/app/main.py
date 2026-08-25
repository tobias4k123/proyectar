from fastapi import FastAPI

# Inicializamos la aplicación
app = FastAPI(title="ProyectAR API", version="1.0")

# Creamos nuestra primera ruta
@app.get("/")
def read_root():
    return {"mensaje": "¡Hola, ProyectAR! El backend está funcionando perfectamente."}