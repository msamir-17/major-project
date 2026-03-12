from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel


class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None

    is_mentor: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = "English"
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None

    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    languages_spoken: Optional[str] = "English"
    mentor_availability: Optional[str] = None
    hourly_rate: Optional[float] = 0.0
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None


class MentorProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="userprofile.id", unique=True)

    skills: str = Field(default="")
    expertise: str = Field(default="")
    experience_years: int = Field(default=0)
    languages_spoken: str = Field(default="English")
    availability: str = Field(default="")

    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    rating: Optional[float] = None
    max_students: Optional[int] = None
    preferred_learning_styles: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="userprofile.id")
    recipient_id: int = Field(foreign_key="userprofile.id")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = Field(default=False)


class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    mentor_id: int = Field(foreign_key="userprofile.id")
    learner_id: int = Field(foreign_key="userprofile.id")
    scheduled_time: datetime
    duration_minutres: int = Field(default=30)
    status: str = Field(default="pending")
    meeting_link: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CommunityPost(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    tags: Optional[str] = Field(default="")
    author_id: int = Field(foreign_key="userprofile.id", index=True)
    likes_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="communitypost.id", index=True)
    user_id: int = Field(foreign_key="userprofile.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PostLike(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="communitypost.id", index=True)
    user_id: int = Field(foreign_key="userprofile.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)