from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

default_url = "postgresql://postgres:postgres@localhost:5432/postgres"

try:
    engine = create_engine(default_url)
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname='gisdb'"))
        if not result.fetchone():
            print("Creating database gisdb...")
            conn.execute(text("CREATE DATABASE gisdb"))
        else:
            print("Database gisdb already exists.")
            
        print("Checking PostGIS extension...")
        gis_engine = create_engine("postgresql://postgres:postgres@localhost:5432/gisdb")
        with gis_engine.connect() as gis_conn:
            gis_conn.execution_options(isolation_level="AUTOCOMMIT")
            gis_conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            print("PostGIS is available.")
            
    print("SUCCESS")
except OperationalError as e:
    print(f"FAILED: Could not connect to PostgreSQL. {e}")
except Exception as e:
    print(f"FAILED: {e}")
