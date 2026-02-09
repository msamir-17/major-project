from __future__ import annotations
from typing import Optional
from sqlmodel import SQLModel, Field

class UserProfile(SQLModel, table=True):
    """User profile model for both learners and mentors"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Required fields
    full_name: str
    email: str = Field(unique=True)
    password: str
    role: str = Field(default="learner")

    # Optional profile fields
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None

    # Learner-specific fields
    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = None
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: str = Field(default="")
    current_skills: str = Field(default="")

class MentorProfile(SQLModel, table=True):
    """Mentor-specific profile extending user profile"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign key to user profile - this creates the relationship
    user_id: int = Field(foreign_key="userprofile.id", unique=True)
    
    # Required mentor fields
    skills: str = Field(default="")
    expertise: str = Field(default="")
    experience_years: int = Field(default=0)
    languages_spoken: str = Field(default="English")
    availability: str = Field(default="")

    # Optional mentor fields
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    rating: Optional[float] = None
    max_students: Optional[int] = None
    preferred_learning_styles: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None