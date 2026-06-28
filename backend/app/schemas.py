from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# --- User ---
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


# --- Meeting ---
class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    start_time: Optional[datetime] = None
    duration: Optional[int] = 60

class MeetingOut(BaseModel):
    id: int
    meeting_id: str
    title: str
    description: Optional[str] = ""
    type: str
    status: str
    start_time: Optional[datetime] = None
    duration: Optional[int] = 60
    daily_room_name: Optional[str] = None
    invite_link: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Participant ---
class ParticipantCreate(BaseModel):
    display_name: str

class ParticipantOut(BaseModel):
    id: int
    display_name: str
    joined_at: datetime
    left_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Transcript ---
class TranscriptCreate(BaseModel):
    speaker_name: str
    text: str

class TranscriptOut(BaseModel):
    id: int
    speaker_name: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True