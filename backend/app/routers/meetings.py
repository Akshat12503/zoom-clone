from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import random
import string
import httpx
import os
from dotenv import load_dotenv

from ..database import get_db
from ..models import Meeting, User
from ..schemas import MeetingCreate, MeetingOut

load_dotenv()

router = APIRouter()

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = os.getenv("DAILY_API_URL")

def generate_meeting_id():
    parts = []
    for length in [3, 4, 3]:
        parts.append(''.join(random.choices(string.ascii_lowercase, k=length)))
    return '-'.join(parts)

async def create_daily_room(room_name: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DAILY_API_URL}/rooms",
            headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
            json={
                "name": room_name,
                "properties": {
                    "enable_transcription": True,
                    "enable_chat": True,
                }
            }
        )
        return response.json()


# GET all meetings
@router.get("/", response_model=list[MeetingOut])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()


# GET upcoming meetings
@router.get("/upcoming", response_model=list[MeetingOut])
def get_upcoming(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(Meeting).filter(
        Meeting.status == "waiting",
        Meeting.start_time > now
    ).order_by(Meeting.start_time.asc()).all()


# GET recent/ended meetings
@router.get("/recent", response_model=list[MeetingOut])
def get_recent(db: Session = Depends(get_db)):
    return db.query(Meeting).filter(
        Meeting.status == "ended"
    ).order_by(Meeting.created_at.desc()).limit(10).all()


# GET single meeting by meeting_id
@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# POST create new meeting (instant or scheduled)
@router.post("/", response_model=MeetingOut)
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    mid = generate_meeting_id()

    meeting = Meeting(
        meeting_id=mid,
        title=data.title,
        description=data.description,
        host_id=user.id,
        type=data.type,
        status="waiting",
        start_time=data.start_time or datetime.utcnow(),
        duration=data.duration,
        invite_link=f"http://localhost:3000/join/{mid}"
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# POST start a meeting — creates Daily.co room
@router.post("/{meeting_id}/start", response_model=MeetingOut)
async def start_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.daily_room_name:
        # Room already created, just reactivate
        meeting.status = "active"
        db.commit()
        db.refresh(meeting)
        return meeting

    # Create Daily.co room
    room_name = f"zoom-clone-{meeting_id}"
    daily_response = await create_daily_room(room_name)

    meeting.daily_room_name = daily_response.get("name", room_name)
    meeting.status = "active"
    db.commit()
    db.refresh(meeting)
    return meeting


# POST end a meeting
@router.post("/{meeting_id}/end", response_model=MeetingOut)
def end_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.status = "ended"
    db.commit()
    db.refresh(meeting)
    return meeting