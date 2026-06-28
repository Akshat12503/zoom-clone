from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import meetings, participants, transcripts
from . import seed

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(participants.router, prefix="/api/participants", tags=["participants"])
app.include_router(transcripts.router, prefix="/api/transcripts", tags=["transcripts"])

@app.on_event("startup")
def on_startup():
    seed.run()

@app.get("/")
def root():
    return {"message": "Zoom Clone API is running"}

@app.get("/api/me")
def get_me():
    from .database import SessionLocal
    from .models import User
    db = SessionLocal()
    user = db.query(User).first()
    db.close()
    return user