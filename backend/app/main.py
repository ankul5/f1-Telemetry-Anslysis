from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers.health import router as health_router
from app.routers.drivers import router as drivers_router
from app.config import HOST, PORT

# Create database tables automatically if missing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PitWall AI Backend API",
    description="FastAPI Backend for PitWall AI F1 Strategy & Telemetry Application",
    version="1.0.0"
)

# Configure CORS for Expo / Expo Go frontend accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(drivers_router)

@app.get("/")
def read_root():
    return {
        "message": "PitWall AI Backend Engine Online",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
