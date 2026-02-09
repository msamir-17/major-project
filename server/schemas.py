"""
Pydantic schemas for SkillBridge API
Defines request/response models for user authentication and profile management
"""
from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for creating a new user account"""
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    location: Optional[str] = Field(None, max_length=100, description="User location")
    is_mentor: bool = Field(default=False, description="Whether user is registering as mentor")
    
    # Learner-specific fields
    learning_goal: Optional[str] = Field(None, max_length=200, description="Learning objectives")
    preferred_language: Optional[str] = Field(None, max_length=50, description="Preferred language")
    time_zone: Optional[str] = Field(None, max_length=50, description="User's timezone")
    learning_style: Optional[str] = Field(None, max_length=50, description="Preferred learning style")
    experience_level: Optional[str] = Field(None, max_length=50, description="Current experience level")
    availability: Optional[str] = Field(None, max_length=100, description="Availability schedule")
    skills_interested: Optional[str] = Field(None, description="Skills interested in learning")
    current_skills: Optional[str] = Field(None, description="Current skills possessed")

    # Mentor fields (required if is_mentor=True)
    skills: Optional[str] = Field(None, description="Mentor's skills (required for mentors)")
    expertise: Optional[str] = Field(None, description="Mentor's expertise areas")
    experience_years: Optional[int] = Field(None, ge=0, le=50, description="Years of experience")
    languages_spoken: Optional[str] = Field(None, description="Languages spoken by mentor")
    mentor_availability: Optional[str] = Field(None, description="Mentor availability schedule")
    hourly_rate: Optional[float] = Field(None, ge=0, description="Hourly rate for mentoring")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL")
    company: Optional[str] = Field(None, max_length=100, description="Current company")
    job_title: Optional[str] = Field(None, max_length=100, description="Current job title")

    @validator('skills', 'expertise')
    def validate_mentor_required_fields(cls, v, values):
        """Validate required fields for mentors"""
        if values.get('is_mentor') and not v:
            raise ValueError('This field is required for mentors')
        return v

    @validator('experience_years')
    def validate_mentor_experience(cls, v, values):
        """Validate experience years for mentors"""
        if values.get('is_mentor') and (v is None or v < 1):
            raise ValueError('Experience years must be at least 1 for mentors')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User password")


class UserRead(BaseModel):
    """Schema for reading user profile data"""
    id: int
    full_name: str
    email: EmailStr
    role: str
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
    skills_interested: str = ""
    current_skills: str = ""

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    
    # Learner fields
    learning_goal: Optional[str] = Field(None, max_length=200)
    preferred_language: Optional[str] = Field(None, max_length=50)
    time_zone: Optional[str] = Field(None, max_length=50)
    learning_style: Optional[str] = Field(None, max_length=50)
    experience_level: Optional[str] = Field(None, max_length=50)
    availability: Optional[str] = Field(None, max_length=100)
    skills_interested: Optional[str] = None
    current_skills: Optional[str] = None


class MentorProfileCreate(BaseModel):
    """Schema for creating mentor profile"""
    user_id: int = Field(..., description="User ID this mentor profile belongs to")
    skills: str = Field(..., min_length=1, description="Mentor's skills")
    expertise: str = Field(..., min_length=1, description="Areas of expertise")
    experience_years: int = Field(..., ge=1, le=50, description="Years of experience")
    languages_spoken: str = Field(default="English", description="Languages spoken")
    availability: str = Field(..., description="Availability schedule")
    hourly_rate: Optional[float] = Field(None, ge=0, description="Hourly rate")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL")
    is_active: bool = Field(default=True, description="Whether mentor is active")
    max_students: Optional[int] = Field(None, ge=1, le=50, description="Maximum students")
    preferred_learning_styles: Optional[str] = Field(None, description="Preferred teaching styles")
    company: Optional[str] = Field(None, max_length=100, description="Current company")
    job_title: Optional[str] = Field(None, max_length=100, description="Job title")


class MentorProfileRead(BaseModel):
    """Schema for reading mentor profile data"""
    id: int
    user_id: int
    skills: str
    expertise: str
    experience_years: int
    languages_spoken: str
    availability: str
    hourly_rate: Optional[float] = None
    linkedin_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    rating: Optional[float] = None
    max_students: Optional[int] = None
    preferred_learning_styles: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None

    class Config:
        from_attributes = True


class MentorProfileUpdate(BaseModel):
    """Schema for updating mentor profile"""
    skills: Optional[str] = Field(None, min_length=1)
    expertise: Optional[str] = Field(None, min_length=1)
    experience_years: Optional[int] = Field(None, ge=1, le=50)
    languages_spoken: Optional[str] = None
    availability: Optional[str] = None
    hourly_rate: Optional[float] = Field(None, ge=0)
    linkedin_url: Optional[str] = None
    is_active: Optional[bool] = None
    max_students: Optional[int] = Field(None, ge=1, le=50)
    preferred_learning_styles: Optional[str] = None
    company: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)


class UserWithMentorProfile(UserRead):
    """Schema for user with mentor profile included"""
    mentor_profile: Optional[MentorProfileRead] = None


class Token(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenData(BaseModel):
    """Schema for token data"""
    email: Optional[str] = None


class MessageResponse(BaseModel):
    """Schema for simple message responses"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str
    error_code: Optional[str] = None
    success: bool = False


class PaginatedResponse(BaseModel):
    """Schema for paginated responses"""
    items: list
    total: int
    page: int
    size: int
    pages: int


class MentorSearchFilters(BaseModel):
    """Schema for mentor search filters"""
    skills: Optional[str] = Field(None, description="Skills to search for")
    expertise: Optional[str] = Field(None, description="Expertise areas")
    min_experience: Optional[int] = Field(None, ge=0, description="Minimum years of experience")
    max_experience: Optional[int] = Field(None, ge=0, description="Maximum years of experience")
    languages: Optional[str] = Field(None, description="Languages spoken")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Minimum rating")
    max_hourly_rate: Optional[float] = Field(None, ge=0, description="Maximum hourly rate")
    availability: Optional[str] = Field(None, description="Availability schedule")
    location: Optional[str] = Field(None, description="Location preference")
    is_verified: Optional[bool] = Field(None, description="Only verified mentors")
    company: Optional[str] = Field(None, description="Company filter")


class MentorSearchResponse(BaseModel):
    """Schema for mentor search results"""
    mentors: list[UserWithMentorProfile]
    total: int
    page: int
    size: int
    pages: int
    filters_applied: MentorSearchFilters