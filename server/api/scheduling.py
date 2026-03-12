from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
from database import get_db
from models import UserProfile, Session as SessionModel
from core.security import get_current_user

from dateutil.parser import parse as parse_datetime

router = APIRouter()

PENDING_EXPIRY_DAYS = 3


def _auto_expire_pending_session(db: DBSession, session_obj: SessionModel) -> bool:
    status = str(session_obj.status or "").lower().strip()
    if status != "pending":
        return False

    created_at = getattr(session_obj, "created_at", None)
    if not created_at:
        return False

    if datetime.utcnow() - created_at >= timedelta(days=PENDING_EXPIRY_DAYS):
        session_obj.status = "expired"
        db.add(session_obj)
        return True

    return False


def _auto_expire_pending_sessions(db: DBSession, sessions: List[SessionModel]) -> None:
    dirty = False
    for s in sessions:
        if _auto_expire_pending_session(db, s):
            dirty = True
    if dirty:
        db.commit()
        for s in sessions:
            if str(s.status or "").lower().strip() == "expired":
                try:
                    db.refresh(s)
                except Exception:
                    pass


@router.get("/sessions/cleanup")
def cleanup_expired_sessions(
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=PENDING_EXPIRY_DAYS)
    statement = select(SessionModel).where(
        (SessionModel.status == "pending") & (SessionModel.created_at < cutoff)
    )
    sessions = db.exec(statement).all()

    updated = 0
    for s in sessions:
        if _auto_expire_pending_session(db, s):
            updated += 1
    if updated:
        db.commit()

    return {"expired_count": updated}

class SessionRequest(BaseModel):
            mentor_id: int
            scheduled_time: str # Accept a string instead


class SessionResponseRequest(BaseModel):
            status: str


class MeetingLinkRequest(BaseModel):
            meeting_link: str

@router.post("/sessions/book", response_model=SessionModel)
def book_session(
    request: SessionRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    if current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only learners can book sessions.")

    # The receptionist's logic starts here.

    # 1. Check: Is the person trying to book themselves?
    if request.mentor_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book a session with yourself.")

    # 2. Create a new entry in the appointment book.
    new_session = SessionModel(
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


@router.get("/sessions/me", response_model=List[SessionModel])
def get_my_sessions(
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    statement = select(SessionModel).where(
        (SessionModel.learner_id == current_user.id) |
        (SessionModel.mentor_id == current_user.id)
    ).order_by(SessionModel.scheduled_time)
    
    sessions = db.exec(statement).all()
    _auto_expire_pending_sessions(db, sessions)
    return sessions


@router.get("/sessions/{session_id}", response_model=SessionModel)
def get_session(
    session_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    session_obj = db.get(SessionModel, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.id not in {session_obj.mentor_id, session_obj.learner_id}:
        raise HTTPException(status_code=403, detail="Not allowed")

    if _auto_expire_pending_session(db, session_obj):
        db.commit()
        db.refresh(session_obj)

    return session_obj


@router.put("/sessions/{session_id}/meeting-link", response_model=SessionModel)
def set_meeting_link(
    session_id: int,
    request: MeetingLinkRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    if not current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only mentors can update meeting links.")

    session_obj = db.get(SessionModel, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    if _auto_expire_pending_session(db, session_obj):
        db.commit()
        db.refresh(session_obj)

    if session_obj.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can update this session")

    if str(session_obj.status or "").lower().strip() != "accepted":
        raise HTTPException(status_code=400, detail="Meeting link can only be added for accepted sessions")

    session_obj.meeting_link = request.meeting_link.strip()
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.put("/sessions/{session_id}/complete", response_model=SessionModel)
def mark_session_complete(
    session_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    if not current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only mentors can complete sessions.")

    session_obj = db.get(SessionModel, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    if _auto_expire_pending_session(db, session_obj):
        db.commit()
        db.refresh(session_obj)

    if session_obj.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can complete this session")

    if str(session_obj.status or "").lower().strip() != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted sessions can be completed")

    session_obj.is_completed = True
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.put("/sessions/{session_id}/respond", response_model=SessionModel)
def respond_to_session(
    session_id: int,
    request: SessionResponseRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: DBSession = Depends(get_db),
) :
    if not current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only mentors can respond to session requests.")

    session_obj = db.get(SessionModel, session_id)
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    if _auto_expire_pending_session(db, session_obj):
        db.commit()
        db.refresh(session_obj)

    if session_obj.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the mentor can respond to this session")

    new_status = request.status.lower().strip()
    if new_status not in {"accepted", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'accepted' or 'rejected'.")

    if str(session_obj.status or "").lower().strip() == "expired":
        raise HTTPException(status_code=400, detail="Session request expired")

    if str(session_obj.status or "").lower().strip() != "pending":
        raise HTTPException(status_code=400, detail="Session has already been responded to")

    session_obj.status = new_status
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj