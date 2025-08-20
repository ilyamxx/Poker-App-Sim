import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.api.v1 import hands as hands_router
from src.core.database import startup_db_client, shutdown_db_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_db_client()
    yield
    shutdown_db_client()

app = FastAPI(lifespan=lifespan)

cors_origins_str = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

if not origins:
    print("Warning: No CORS_ORIGINS specified. All cross-origin requests will be blocked.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- END OF REFACTORED SECTION ---

app.include_router(hands_router.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
