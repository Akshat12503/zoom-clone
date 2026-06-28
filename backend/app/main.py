from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import meetings, participants, transcripts
from . import seed
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://zoom-clone-chi-sable.vercel.app",
        "https://zoom-clone-git-main-akshat12503s-projects.vercel.app",
        "https://zoom-clone-ot5kziyma-akshat12503s-projects.vercel.app",
        "https://zoom-clone-r7pppwcfp-akshat12503s-projects.vercel.app",
    ],
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