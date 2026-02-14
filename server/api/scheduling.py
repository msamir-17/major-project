from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from datetime import datetime
from typing import List
from pydantic import BaseModel
from database import get_db
from models import UserProfile, Session
from core.security import get_current_user

from dateutil.parser import parse as parse_datetime

router = APIRouter()

class SessionRequest(BaseModel):
            mentor_id: int
            scheduled_time: str # Accept a string instead

@router.post("/sessions/book", response_model=Session)
def book_session(
    request: SessionRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    # The receptionist's logic starts here.

    # 1. Check: Is the person trying to book themselves?
    if request.mentor_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book a session with yourself.")

    # 2. Create a new entry in the appointment book.
    new_session = Session(
        mentor_id=request.mentor_id,
        learner_id=current_user.id, # The person making the request is the learner
        scheduled_time=parse_datetime(request.scheduled_time),
        status="pending" # All new sessions start as "pending"
    )

    # 3. Save the new appointment to the database.
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # 4. Send the appointment details back as confirmation.
    return new_session


@router.get("/sessions/me", response_model=List[Session])
def get_my_sessions(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = select(Session).where(
        (Session.learner_id == current_user.id) |
        (Session.mentor_id == current_user.id)
    ).order_by(Session.scheduled_time)
    
    sessions = db.exec(statement).all()
    return sessions