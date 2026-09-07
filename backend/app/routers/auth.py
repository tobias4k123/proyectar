from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

# tokenUrl le dice a Swagger UI donde pedir el token con el boton "Authorize"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = security.decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email = payload.get("sub")
    if email is None:
        raise credentials_exception

    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if usuario is None:
        raise credentials_exception

    return usuario


@router.post(
    "/register", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED
)
def register(datos: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    ya_existe = db.query(models.Usuario).filter(models.Usuario.email == datos.email).first()
    if ya_existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado"
        )

    nuevo_usuario = models.Usuario(
        nombre=datos.nombre,
        email=datos.email,
        password=security.hash_password(datos.password),
        rol=models.RolEnum.ALUMNO,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm usa "username", ahi mandamos el email.
    usuario = (
        db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    )
    if not usuario or not security.verify_password(form_data.password, usuario.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(data={"sub": usuario.email})
    return schemas.Token(access_token=access_token)


@router.post("/logout")
def logout(current_user: models.Usuario = Depends(get_current_user)):
    # JWT es stateless: no hay sesion que borrar del lado del servidor sin
    # una blocklist de tokens. El cliente simplemente descarta el token que
    # tenia guardado. Dejamos el endpoint por consistencia con la API
    # documentada y porque exige un token valido (confirma que cierra su
    # propia sesion, no la de otro).
    return {"mensaje": "Sesión cerrada"}


@router.get("/me", response_model=schemas.UsuarioOut)
def leer_usuario_actual(current_user: models.Usuario = Depends(get_current_user)):
    return current_user
