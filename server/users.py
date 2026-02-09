"""
User management API endpoints for SkillBridge platform
Handles user registration, authentication, profile management, and mentor operations
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from database import engine
from models import UserProfile, MentorProfile
from core.security import hash_password, verify_password, create_access_token, get_current_user
from core.dependencies import get_db
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()  # Remove prefix here - it will be added in main.py


def get_session():
    """Database session dependency"""
    with Session(engine) as session:
        yield session


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: dict, session: Session = Depends(get_session)):
    """
    Register a new user account (learner or mentor)
    Creates user profile based on provided data
    """
    try:
        # Check if email already exists
        existing_user = session.exec(
            select(UserProfile).where(UserProfile.email == user_data.get("email"))
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = hash_password(user_data.get("password"))
        
        # Create user profile
        db_user = UserProfile(
            email=user_data.get("email"),
            hashed_password=hashed_password,
            full_name=user_data.get("full_name"),
            phone_number=user_data.get("phone_number"),
            bio=user_data.get("bio"),
            location=user_data.get("location"),
            is_mentor=user_data.get("is_mentor", False),
            
            # Learner fields
            learning_goal=user_data.get("learning_goal"),
            preferred_language=user_data.get("preferred_language", "English"),
            learning_style=user_data.get("learning_style"),
            experience_level=user_data.get("experience_level"),
            availability=user_data.get("availability"),
            skills_interested=user_data.get("skills_interested"),
            current_skills=user_data.get("current_skills"),
            
            # Mentor fields (if applicable)
            skills=user_data.get("skills"),
            expertise=user_data.get("expertise"),
            experience_years=user_data.get("experience_years"),
            languages_spoken=user_data.get("languages_spoken", "English"),
            mentor_availability=user_data.get("mentor_availability"),
            hourly_rate=user_data.get("hourly_rate", 0.0),
            linkedin_url=user_data.get("linkedin_url"),
            company=user_data.get("company"),
            job_title=user_data.get("job_title"),
        )
        
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": db_user.email, "user_id": db_user.id}
        )
        
        logger.info(f"User registered successfully: {db_user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "full_name": db_user.full_name,
                 "is_mentor": db_user.is_mentor,
                "role": "mentor" if db_user.is_mentor else "learner"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=dict)
async def login_user(login_data: dict, session: Session = Depends(get_session)):
    """
    Authenticate user and return access token
    """
    try:
        # Find user by email
        db_user = session.exec(
            select(UserProfile).where(UserProfile.email == login_data.get("email"))
        ).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.get("password"), db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": db_user.email, "user_id": db_user.id}
        )
        
        logger.info(f"User logged in successfully: {db_user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "full_name": db_user.full_name,
                "is_mentor": db_user.is_mentor
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's profile"""
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number,
            "bio": current_user.bio,
            "location": current_user.location,
            "is_mentor": current_user.is_mentor,
            "learning_goal": current_user.learning_goal,
            "preferred_language": current_user.preferred_language,
            "skills_interested": current_user.skills_interested,
            "current_skills": current_user.current_skills,
            "skills": current_user.skills,
            "expertise": current_user.expertise,
            "experience_years": current_user.experience_years,
            "hourly_rate": current_user.hourly_rate,
            "company": current_user.company,
            "job_title": current_user.job_title
        }
        
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )


@router.get("/mentors", response_model=List[dict])
async def get_all_mentors(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    """Get all mentors - Legacy endpoint for compatibility"""
    try:
        mentors = session.exec(
            select(UserProfile)
            .where(UserProfile.is_mentor == True)
            .offset(skip)
            .limit(limit)
        ).all()
        
        return [
            {
                "id": mentor.id,
                "full_name": mentor.full_name,
                "email": mentor.email,
                "skills": mentor.skills,
                "expertise": mentor.expertise,
                "experience_years": mentor.experience_years,
                "hourly_rate": mentor.hourly_rate,
                "bio": mentor.bio,
                "location": mentor.location,
                "company": mentor.company,
                "job_title": mentor.job_title,
                "linkedin_url": mentor.linkedin_url,
                "languages_spoken": mentor.languages_spoken,
            }
            for mentor in mentors
        ]
        
    except Exception as e:
        logger.error(f"Get mentors error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch mentors: {str(e)}"
        )


@router.get("/debug", response_model=dict)
async def debug_users(session: Session = Depends(get_session)):
    """Debug endpoint to check users"""
    try:
        users = session.exec(select(UserProfile)).all()
        mentors = [u for u in users if u.is_mentor]
        learners = [u for u in users if not u.is_mentor]
        
        return {
            "total_users": len(users),
            "mentors": len(mentors),
            "learners": len(learners),
            "sample_users": [
                {
                    "id": u.id,
                    "name": u.full_name,
                    "email": u.email,
                    "is_mentor": u.is_mentor
                }
                for u in users[:5]
            ]
        }
    except Exception as e:
        logger.error(f"Debug failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug failed: {str(e)}"
        )