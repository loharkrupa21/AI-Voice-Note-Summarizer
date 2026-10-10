
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

# Extract and remove query parameters unsupported by PyMySQL
query = dict(url.query)
ssl_mode_param = query.pop("ssl-mode", None) or query.pop("ssl_mode", None)
url = url.set(query=query)

# Configure SSL
connect_args = {}

if url.drivername.startswith("mysql"):
    # Detect if host is a local development instance
    host_lower = (url.host or "").lower()
    is_local_host = host_lower in ("localhost", "127.0.0.1", "::1", "")

    # Check for SSL mode override via environment variable or URL query parameter
    ssl_mode = (os.getenv("MYSQL_SSL_MODE") or ssl_mode_param or "").lower()

    # Optional custom CA bundle path from environment
    ca_env = os.getenv("MYSQL_SSL_CA")
    ca_file = Path(ca_env) if ca_env else (Path(__file__).resolve().parent / "ca.pem")

    if is_local_host:
        # Local development (loopback connection on developer's machine):
        # 1. If an explicit local CA certificate was supplied in MYSQL_SSL_CA, honor it.
        # 2. If SSL is explicitly disabled via MYSQL_SSL_MODE=disabled, disable SSL.
        # 3. Otherwise, do NOT force the remote cloud ca.pem onto local MySQL,
        #    avoiding self-signed certificate chain verification failures while allowing
        #    standard local secure TLS negotiation.
        if ca_env and ca_file.exists():
            connect_args["ssl"] = {"ca": str(ca_file)}
        elif ssl_mode in ("disabled", "disable", "false", "0"):
            connect_args["ssl_disabled"] = True
        else:
            # Default local MySQL: unconstrained SSL/TLS negotiation without remote CA validation
            pass
    else:
        # Remote / Production database (Render, Railway, TiDB, Aiven, AWS RDS):
        # Strictly enforce SSL using the project CA certificate bundle when available.
        if ssl_mode in ("disabled", "disable", "false", "0"):
            connect_args["ssl_disabled"] = True
        elif ca_file.exists():
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
    err_str = str(exc)
    if "CERTIFICATE_VERIFY_FAILED" in err_str or "certificate verify failed" in err_str.lower():
        print("Database connection failed: SSL certificate verification failed. Check local vs remote SSL configuration.")
    elif "10061" in err_str or "refused" in err_str.lower():
        print("Database connection failed: Connection refused. Check if MySQL server is running.")
    elif "1045" in err_str or "access denied" in err_str.lower():
        print("Database connection failed: Access denied. Check database credentials.")
    elif "1049" in err_str or "unknown database" in err_str.lower():
        print("Database connection failed: Target database does not exist.")
    else:
        print("Database connection failed:", type(exc).__name__)

