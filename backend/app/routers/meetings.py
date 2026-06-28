from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import os

from ..database import get_db
from ..models import Meeting, User
from ..schemas import MeetingCreate, MeetingOut

router = APIRouter()


def generate_meeting_id() -> str:
    uid = uuid.uuid4().hex
    return f"{uid[:3]}-{uid[3:7]}-{uid[7:11]}"


# GET /api/meetings/upcoming
@router.get("/upcoming", response_model=list[MeetingOut])
def get_upcoming(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(Meeting).filter(
        Meeting.start_time >= now,
        Meeting.status == "waiting"
    ).order_by(Meeting.start_time).all()


# GET /api/meetings/recent
@router.get("/recent", response_model=list[MeetingOut])
def get_recent(db: Session = Depends(get_db)):
    return db.query(Meeting).filter(
        Meeting.status.in_(["ended", "active"])
    ).order_by(Meeting.created_at.desc()).limit(10).all()


# GET /api/meetings/{meeting_id}
@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# POST /api/meetings/instant
@router.post("/instant", response_model=MeetingOut)
def create_instant_meeting(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found. Did you seed the database?")

    meeting_id = generate_meeting_id()
    invite_link = f"http://localhost:3000/join/{meeting_id}"

    meeting = Meeting(
        meeting_id=meeting_id,
        title="Instant Meeting",
        description="",
        host_id=user.id,
        type="instant",
        status="waiting",
        start_time=datetime.utcnow(),
        duration=60,
        invite_link=invite_link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# POST /api/meetings/schedule
@router.post("/schedule", response_model=MeetingOut)
def schedule_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found. Did you seed the database?")

    meeting_id = generate_meeting_id()
    invite_link = f"http://localhost:3000/join/{meeting_id}"

    meeting = Meeting(
        meeting_id=meeting_id,
        title=data.title,
        description=data.description or "",
        host_id=user.id,
        type="scheduled",
        status="waiting",
        start_time=data.start_time,
        duration=data.duration,
        invite_link=invite_link,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# POST /api/meetings/{meeting_id}/start
@router.post("/{meeting_id}/start")
def start_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Mark as active — Jitsi room is created on the frontend using the meeting_id
    meeting.status = "active"
    meeting.daily_room_name = f"zoomclone-{meeting_id.replace('-', '')}"
    db.commit()
    db.refresh(meeting)

    return {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "status": meeting.status,
    }


# POST /api/meetings/{meeting_id}/end
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