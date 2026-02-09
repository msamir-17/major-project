"""
FastAPI dependencies for SkillBridge platform
Provides reusable dependency functions for database sessions, authentication, etc.
"""
from sqlmodel import Session
from database import engine
from .security import get_current_user


def get_db():
    """
    Database session dependency for FastAPI endpoints
    
    Provides a database session that automatically handles cleanup.
    Use as a dependency in FastAPI route functions.
    
    Yields:
        Session: SQLModel database session
    """
    with Session(engine) as session:
        yield session


# Re-export for convenience
__all__ = ["get_db", "get_current_user"]