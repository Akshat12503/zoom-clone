from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Transcript, Meeting
from ..schemas import TranscriptCreate, TranscriptOut

router = APIRouter()


# GET all transcripts for a meeting
@router.get("/{meeting_id}", response_model=list[TranscriptOut])
def get_transcripts(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting.transcripts


# POST save a transcript line
@router.post("/{meeting_id}", response_model=TranscriptOut)
def save_transcript(
    meeting_id: str,
    data: TranscriptCreate,
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = Transcript(
        meeting_id=meeting.id,
        speaker_name=data.speaker_name,
        text=data.text,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript