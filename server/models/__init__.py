"""
Models package for SkillBridge platform

This package contains all data models used throughout the application,
including database models, API request/response models, and authentication models.

The models are organized by domain:
- user: User profiles, authentication, and account management
- recommendation: Mentor recommendation system models
"""

# Import user models
from .user import (
    UserProfile,
    MentorProfile, 
    UserCreate,
    UserUpdate,
    UserResponse,
    Token,
    TokenData,
    UserInDB
)

# Import recommendation models with error handling for optional functionality
try:
    from .recommendation import (
        MatchType,
        RecommendationScore,
        MentorRecommendation,
        RecommendationFilters,
        RecommendationResponse,
        UserLearningProfile
    )
    RECOMMENDATIONS_AVAILABLE = True
except ImportError:
    # Recommendation models not available - this is acceptable
    # for basic functionality without recommendation system
    RECOMMENDATIONS_AVAILABLE = False

# Export user models (always available)
__all__ = [
    # User models
    "UserProfile",
    "MentorProfile",
    "UserCreate", 
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenData",
    "UserInDB",
]

# Export recommendation models if available
if RECOMMENDATIONS_AVAILABLE:
    __all__.extend([
        "MatchType",
        "RecommendationScore", 
        "MentorRecommendation",
        "RecommendationFilters",
        "RecommendationResponse",
        "UserLearningProfile"
    ])


# Add the new Message class here
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="userprofile.id")      # <--- CHANGE THIS
    recipient_id: int = Field(foreign_key="userprofile.id")   # <--- AND THIS
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = Field(default=False)


class Session(SQLModel, table=True):
    id:Optional[int] = Field(default=None,primary_key=True)
    mentor_id: int = Field(foreign_key="userprofile.id")
    learner_id:int = Field(foreign_key="userprofile.id")

    scheduled_time:datetime
    duration_minutres: int = Field(default=30)

    status:str = Field(default="pending")

    meeting_link: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    is_completed: bool = Field(default=False)

    created_at:datetime = Field(default_factory=datetime.utcnow)


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

__all__.append("Message")
__all__.append("Session")  
__all__.append("CommunityPost")
__all__.append("Comment")
__all__.append("PostLike")