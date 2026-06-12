from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.core.database import engine
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe migration to add deadline column to tests table if it doesn't exist
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE tests ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE NULL;"))
            print("Migration: deadline column checked/added to tests table.")
    except Exception as e:
        print(f"Migration error: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"status": "ok", "message": "LMS Backend is running"}
