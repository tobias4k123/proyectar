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


def upgrade() -> None:
    """Upgrade schema."""
    # historial_academico todavia esta vacia (CU-03 no esta implementado
    # todavia), asi que se puede cambiar el tipo de columna directamente
    # sin migrar datos existentes.
    op.drop_column('historial_academico', 'estado')
    op.add_column(
        'historial_academico',
        sa.Column(
            'estado',
            sa.Enum('CURSANDO', 'REGULAR', 'APROBADA', 'LIBRE', name='estadohistorial'),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('historial_academico', 'estado')
    op.add_column('historial_academico', sa.Column('estado', sa.String(), nullable=False))
    sa.Enum(name='estadohistorial').drop(op.get_bind(), checkfirst=True)
