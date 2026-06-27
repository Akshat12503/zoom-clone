from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Participant, Meeting
from ..schemas import ParticipantCreate, ParticipantOut

router = APIRouter()


# GET all participants of a meeting
@router.get("/{meeting_id}", response_model=list[ParticipantOut])
def get_participants(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting.participants


# POST join a meeting
@router.post("/{meeting_id}/join", response_model=ParticipantOut)
def join_meeting(
    meeting_id: str,
    data: ParticipantCreate,
    db: Session = Depends(get_db)
):
    meeting = db.query(Meeting).filter(
        Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant = Participant(
        meeting_id=meeting.id,
        display_name=data.display_name,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


# POST leave a meeting
@router.post("/{meeting_id}/leave/{participant_id}")
def leave_meeting(
    meeting_id: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    participant = db.query(Participant).filter(
        Participant.id == participant_id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.left_at = datetime.utcnow()
    db.commit()
    return {"message": "Left meeting successfully"}