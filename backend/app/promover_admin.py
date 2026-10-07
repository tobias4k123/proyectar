"""
Promueve un usuario ya registrado a rol ADMIN. No hay otra forma de crear
el primer administrador: /auth/register siempre crea alumnos (a proposito,
para que nadie pueda autoasignarse permisos de admin via la API).

Uso (con los contenedores corriendo, usuario ya registrado normalmente
desde el frontend):
    docker compose exec backend python -m app.promover_admin correo@ejemplo.com

Es idempotente: si el usuario ya es admin, no hace nada.
"""
import sys

from .database import SessionLocal
from .models import RolEnum, Usuario


def promover(email: str) -> None:
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if not usuario:
            print(f"No existe ningún usuario registrado con el email '{email}'.")
            return

        if usuario.rol == RolEnum.ADMIN:
            print(f"'{email}' ya es administrador, no hay nada para hacer.")
            return

        usuario.rol = RolEnum.ADMIN
        db.commit()
        print(f"'{email}' ahora es administrador.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python -m app.promover_admin correo@ejemplo.com")
        sys.exit(1)
    promover(sys.argv[1])
