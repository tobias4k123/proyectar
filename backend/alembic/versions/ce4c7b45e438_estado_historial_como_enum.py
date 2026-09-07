"""Convertir historial_academico.estado de texto libre a Enum

Revision ID: ce4c7b45e438
Revises: eab77434ea59
Create Date: 2026-09-07 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ce4c7b45e438'
down_revision: Union[str, Sequence[str], None] = 'eab77434ea59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


estado_historial_enum = sa.Enum(
    'CURSANDO', 'REGULAR', 'APROBADA', 'LIBRE', name='estadohistorial'
)


def upgrade() -> None:
    """Upgrade schema."""
    # historial_academico todavia esta vacia (CU-03 no esta implementado
    # todavia), asi que se puede cambiar el tipo de columna directamente
    # sin migrar datos existentes.
    #
    # A diferencia de crear una tabla nueva con una columna Enum (donde
    # Postgres crea el tipo automaticamente), agregar una columna Enum a
    # una tabla YA EXISTENTE con ADD COLUMN no crea el tipo solo -- hay
    # que crearlo a mano antes con CREATE TYPE.
    estado_historial_enum.create(op.get_bind(), checkfirst=True)

    op.drop_column('historial_academico', 'estado')
    op.add_column(
        'historial_academico',
        sa.Column('estado', estado_historial_enum, nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('historial_academico', 'estado')
    op.add_column('historial_academico', sa.Column('estado', sa.String(), nullable=False))
    estado_historial_enum.drop(op.get_bind(), checkfirst=True)
