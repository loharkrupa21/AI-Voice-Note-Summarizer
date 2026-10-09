
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

# Load environment variables
load_dotenv()

# Database URL must be set in Render environment variables
database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError(
        "DATABASE_URL is missing. Set it in the environment variables."
    )

# SSL certificate located in the backend folder
ca_file = Path(__file__).resolve().parent / "ca.pem"

# Database engine
engine = create_engine(
    database_url,
    connect_args={
        "ssl": {
            "ca": str(ca_file)
        }
    },
    pool_pre_ping=True
)

# Base model
Base = declarative_base()

# Database connection test
try:
    with engine.connect() as connection:
        print("Database connection established successfully.")
except Exception as e:
    print("Database connection failed.")
    print(e)