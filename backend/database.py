
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine import make_url

# Load local .env variables (Render uses Environment Variables)
load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError(
        "DATABASE_URL is missing. Set it in Render Environment Variables."
    )

# Parse the URL and remove query parameters unsupported by PyMySQL,
# such as ssl-mode. Configure SSL through connect_args instead.
url = make_url(database_url)

query = dict(url.query)
query.pop("ssl-mode", None)
query.pop("ssl_mode", None)

url = url.set(query=query)

# Configure SSL for the MySQL connection
connect_args = {}

if url.drivername.startswith("mysql"):
    ca_file = Path(__file__).resolve().parent / "ca.pem"

    if ca_file.exists():
        connect_args["ssl"] = {"ca": str(ca_file)}
    else:
        # Use this only if your database provider permits TLS
        # without specifying a CA certificate.
        connect_args["ssl"] = {}

engine = create_engine(
    url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=1800,
)

Base = declarative_base()

# Test connection without preventing the API app from importing
try:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    print("Database connection established successfully.")
except Exception as exc:
    print("Database connection failed:", str(exc))