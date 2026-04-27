import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# Use environment variables for DB connection. 
# Defaulting to a placeholder; user should provide these.
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", "Surya1232005"))
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "attendance_db")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Configure SSL for Aiven or other cloud providers if needed
connect_args = {
    "ssl": {"ca": "ca.pem"},
    "connect_timeout": 10  # 10 seconds timeout for the connection
}

# Use pool_pre_ping to handle dropped connections in cloud environments
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args if DB_HOST != "localhost" else {},
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
