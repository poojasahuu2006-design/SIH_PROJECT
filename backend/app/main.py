from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .database import engine, Base
from .routes import wells, events, drilling

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nearby Wells Intelligence System API",
    description="Backend API for drilling risk prediction and offset well intelligence.",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Nearby Wells Intelligence System API. Visit /docs for documentation."}
