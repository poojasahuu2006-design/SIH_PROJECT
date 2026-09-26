from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from sqlalchemy import text

import time
from contextlib import asynccontextmanager

from .database import engine, Base
from .routes import wells, events, drilling, reports

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Retry database initialization as database may take a few moments to accept connections on cold start
    max_retries = 8
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Connecting to database (attempt {attempt}/{max_retries})...")
            with engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                except Exception as ext_err:
                    print(f"PostGIS extension notice: {ext_err}")
            Base.metadata.create_all(bind=engine)
            print("Database connected and schema initialized successfully.")
            break
        except Exception as e:
            print(f"Database connection attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(3)
            else:
                print("Proceeding with server startup; database schema initialization deferred.")
    yield


app = FastAPI(
    title="Nearby Wells Intelligence System API",
    description="Backend API for drilling risk prediction and offset well intelligence.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(wells.router, prefix="/api", tags=["Wells"])
app.include_router(events.router, prefix="/api", tags=["Drilling Events"])
app.include_router(drilling.router, prefix="/api", tags=["Drilling Data"])
app.include_router(reports.router, prefix="/api", tags=["Historical Reports Intelligence"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Nearby Wells Intelligence System API. Visit /docs for documentation."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
