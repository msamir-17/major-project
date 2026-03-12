from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
# Prefer server/app/.env (used by main.py) but keep fallback behavior.
ENV_PATH = Path(__file__).resolve().parent / "app" / ".env"
load_dotenv(ENV_PATH, override=True)
load_dotenv()

# Get DATABASE_URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Make sure DATABASE_URL is not empty
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

# Create SQLModel engine
engine = create_engine(DATABASE_URL, echo=True)

# Function to create tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency to get DB session
def get_db():
    with Session(engine) as session:
        yield session
