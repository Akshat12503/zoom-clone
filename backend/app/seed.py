from .database import SessionLocal
from .models import User, Meeting
from datetime import datetime, timedelta
import random
import string

def generate_meeting_id():
    parts = []
    for length in [3, 4, 3]:
        parts.append(''.join(random.choices(string.ascii_lowercase, k=length)))
    return '-'.join(parts)

def run():
    db = SessionLocal()

    # Check if already seeded
    existing_user = db.query(User).first()
    if existing_user:
        db.close()
        return

    # Create default user
    user = User(
        name="John Doe",
        email="john@zoomclone.com",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=john"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed some meetings
    now = datetime.utcnow()

    meetings = [
        Meeting(
            meeting_id=generate_meeting_id(),
            title="Team Standup",
            description="Daily team standup meeting",
            host_id=user.id,
            type="scheduled",
            status="ended",
            start_time=now - timedelta(days=1),
            duration=15,
            invite_link="http://localhost:3000/join/abc-defg-hij"
        ),
        Meeting(
            meeting_id=generate_meeting_id(),
            title="Product Review",
            description="Weekly product review session",
            host_id=user.id,
            type="scheduled",
            status="ended",
            start_time=now - timedelta(days=2),
            duration=60,
            invite_link="http://localhost:3000/join/klm-nopq-rst"
        ),
        Meeting(
            meeting_id=generate_meeting_id(),
            title="Design Sync",
            description="UI/UX design sync with the team",
            host_id=user.id,
            type="scheduled",
            status="waiting",
            start_time=now + timedelta(days=1),
            duration=45,
            invite_link="http://localhost:3000/join/uvw-xyza-bcd"
        ),
        Meeting(
            meeting_id=generate_meeting_id(),
            title="Client Demo",
            description="Product demo for the client",
            host_id=user.id,
            type="scheduled",
            status="waiting",
            start_time=now + timedelta(days=3),
            duration=90,
            invite_link="http://localhost:3000/join/efg-hijk-lmn"
        ),
    ]

    for m in meetings:
        db.add(m)

    db.commit()
    db.close()
    print("✅ Database seeded successfully")