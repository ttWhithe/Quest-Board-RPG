"""add last_daily_reset_date to users

Revision ID: a32897b34ef1
Revises: 6cd9ccbc6f7a
Create Date: 2026-11-21 08:38:52.442890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a32897b34ef1'
down_revision: Union[str, None] = '6cd9ccbc6f7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_daily_reset_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_daily_reset_date")
