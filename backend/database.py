import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

# Load environment variables
load_dotenv()

# =========================================================
# DATABASE URL
# =========================================================

database_url = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:12345@localhost:3306/ai_voice_note_summarizer"
)

# =========================================================
# ENGINE
# =========================================================

engine = create_engine(
    database_url,
    pool_pre_ping=True
)

# =========================================================
# BASE
# =========================================================

Base = declarative_base()


# =========================================================
# DATABASE CONNECTION TEST
# =========================================================

try:

    with engine.connect() as connection:

        print(
            "Database connection established successfully."
        )

except Exception as e:

    print(
        "Database connection failed."
    )

    print(e)