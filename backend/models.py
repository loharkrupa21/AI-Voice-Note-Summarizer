
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime
)

from sqlalchemy.sql import func

from database import Base


# =========================================================
# USERS TABLE
# =========================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )


# =========================================================
# VOICE NOTES TABLE
# =========================================================

class VoiceNote(Base):

    __tablename__ = "voice_notes"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True
    )

    email = Column(
        String(255),
        nullable=False,
        index=True
    )

    upload_voice = Column(
        String(500),
        nullable=True
    )

    recorded_voice = Column(
        String(500),
        nullable=True
    )

    transcript = Column(
        Text,
        nullable=True
    )

    summary = Column(
        Text,
        nullable=True
    )

    language = Column(
        String(50),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

