"""
User models for SkillBridge platform

This module contains all user-related data models including database tables,
API request/response models, and authentication models.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import BaseModel, EmailStr


class UserProfile(SQLModel, table=True):
    """
    Main user profile model for database storage
    
    This model serves both mentors and learners with conditional fields
    based on the is_mentor flag.
    """
    # __tablename__ = "users"
    
    # Core identity fields
    id: Optional[int] = Field(default=None, primary_key=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    
    # Account status
    is_mentor: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Learner-specific fields
    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = "English"
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None
    
    # Mentor-specific fields
    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    languages_spoken: Optional[str] = "English"
    mentor_availability: Optional[str] = None
    hourly_rate: Optional[float] = 0.0
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None


class MentorProfile(BaseModel):
    """
    Legacy mentor profile model for backward compatibility
    
    Used by existing endpoints that expect mentor-specific data structure.
    """
    id: int
    full_name: str
    email: str
    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = 0.0
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    languages_spoken: Optional[str] = "English"
    mentor_availability: Optional[str] = None


class UserCreate(BaseModel):
    """
    Model for user creation requests
    
    Includes all fields needed to create either a mentor or learner account.
    Password will be hashed before storage.
    """
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    is_mentor: bool = False
    
    # Learner fields
    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = "English"
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None
    
    # Mentor fields
    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    languages_spoken: Optional[str] = "English"
    mentor_availability: Optional[str] = None
    hourly_rate: Optional[float] = 0.0
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None


class UserUpdate(BaseModel):
    """
    Model for user profile updates
    
    All fields are optional to allow partial updates.
    """
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    
    # Learner fields
    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = None
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None
    
    # Mentor fields
    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    languages_spoken: Optional[str] = None
    mentor_availability: Optional[str] = None
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None


class UserResponse(BaseModel):
    """
    Model for user data in API responses
    
    Excludes sensitive information like hashed_password.
    Safe for public API consumption.
    """
    id: int
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    is_mentor: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Learner fields
    learning_goal: Optional[str] = None
    preferred_language: Optional[str] = None
    time_zone: Optional[str] = None
    learning_style: Optional[str] = None
    experience_level: Optional[str] = None
    availability: Optional[str] = None
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None
    
    # Mentor fields
    skills: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    languages_spoken: Optional[str] = None
    mentor_availability: Optional[str] = None
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None

    class Config:
        """Pydantic configuration"""
        from_attributes = True


class Token(BaseModel):
    """
    JWT token response model
    
    Used for authentication responses after successful login.
    """
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    Token data model for JWT payload validation
    
    Used internally for token verification.
    """
    email: Optional[str] = None


class UserInDB(UserProfile):
    """
    User model with hashed password for internal use
    
    Extends UserProfile to include hashed_password field.
    Used internally by authentication system.
    """
    pass



    