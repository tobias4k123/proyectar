"""Modelar correlatividades con tipo y requisito, agregar codigo a materias

Revision ID: eab77434ea59
Revises: 66e894caf82c
Create Date: 2026-09-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eab77434ea59'
down_revision: Union[str, Sequence[str], None] = '66e894caf82c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # La tabla 'materias' todavia esta vacia en este punto del proyecto,
    # asi que se puede agregar la columna como NOT NULL directamente.
    op.add_column('materias', sa.Column('codigo', sa.String(), nullable=False))
    op.create_index(op.f('ix_materias_codigo'), 'materias', ['codigo'], unique=True)

    # La relacion simple materia<->correlativa (M2M plana) no alcanza:
    # el plan real distingue "para cursar" de "para rendir el final", y
    # "necesita cursada" de "necesita aprobada". Se reemplaza por un
    # modelo propio que puede representar esas dos dimensiones.
    op.drop_table('materia_correlativa')

    op.create_table(
        'correlatividades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('materia_id', sa.Integer(), nullable=False),
        sa.Column('correlativa_id', sa.Integer(), nullable=False),
        sa.Column(
            'tipo',
            sa.Enum('CURSAR', 'FINAL', name='tipocorrelatividad'),
            nullable=False,
        ),
        sa.Column(
            'requiere',
            sa.Enum('CURSADA', 'APROBADA', name='requisitoenum'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['correlativa_id'], ['materias.id']),
        sa.ForeignKeyConstraint(['materia_id'], ['materias.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('materia_id', 'correlativa_id', 'tipo', name='uq_correlatividad'),
    )
    op.create_index(op.f('ix_correlatividades_id'), 'correlatividades', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_correlatividades_id'), table_name='correlatividades')
    op.drop_table('correlatividades')
    sa.Enum(name='tipocorrelatividad').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='requisitoenum').drop(op.get_bind(), checkfirst=True)

    op.create_table(
        'materia_correlativa',
        sa.Column('materia_id', sa.Integer(), nullable=False),
        sa.Column('correlativa_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['correlativa_id'], ['materias.id']),
        sa.ForeignKeyConstraint(['materia_id'], ['materias.id']),
        sa.PrimaryKeyConstraint('materia_id', 'correlativa_id'),
    )

    op.drop_index(op.f('ix_materias_codigo'), table_name='materias')
    op.drop_column('materias', 'codigo')
