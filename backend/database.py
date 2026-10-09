
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine import make_url

# Load local .env variables
load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError(
        "DATABASE_URL is missing. Set it in Render Environment Variables."
    )

# Parse database URL
url = make_url(database_url)

# Explicitly use PyMySQL for MySQL connections
if url.drivername == "mysql":
    url = url.set(drivername="mysql+pymysql")

# Remove query parameters unsupported by PyMySQL
query = dict(url.query)
query.pop("ssl-mode", None)
query.pop("ssl_mode", None)
url = url.set(query=query)

# Configure SSL
connect_args = {}

if url.drivername.startswith("mysql"):
    ca_file = Path(__file__).resolve().parent / "ca.pem"

    if ca_file.exists():
        connect_args["ssl"] = {"ca": str(ca_file)}
    else:
        connect_args["ssl"] = {}

# Create SQLAlchemy engine
engine = create_engine(
    url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=1800,
)

Base = declarative_base()

# Test database connection
try:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    print("Database connection established successfully.")
except Exception as exc:
    print("Database connection failed:", str(exc))

