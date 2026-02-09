"""
Recommendation API routes for SkillBridge platform

This module provides REST endpoints for mentor recommendations, including
personalized suggestions, detailed scoring, and filtering capabilities.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from collections import Counter

from core.dependencies import get_db, get_current_user
from models import UserProfile
from models.recommendation import (
    RecommendationResponse,
    RecommendationFilters,
    MentorRecommendation
)
from services.recommendation_service import RecommendationService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/mentors", response_model=RecommendationResponse)
async def get_mentor_recommendations(
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of recommendations"),
    skills: Optional[str] = Query(None, description="Comma-separated skills to filter by"),
    max_rate: Optional[float] = Query(None, ge=0, description="Maximum hourly rate"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    location: Optional[str] = Query(None, description="Preferred location"),
    languages: Optional[str] = Query(None, description="Comma-separated required languages"),
    min_score: Optional[float] = Query(default=0, ge=0, le=100, description="Minimum recommendation score"),
    include_paid: bool = Query(default=True, description="Include paid mentors"),
    include_free: bool = Query(default=True, description="Include free mentors"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized mentor recommendations for the current user
    
    This endpoint analyzes the user's profile, learning goals, and preferences
    to recommend the most suitable mentors. The algorithm considers:
    - Skills alignment (40% weight)
    - Language compatibility (20% weight)
    - Experience level match (15% weight)
    - Location proximity (10% weight)
    - Availability overlap (10% weight)
    - Learning style compatibility (5% weight)
    
    Args:
        limit: Maximum number of recommendations to return (1-50)
        skills: Comma-separated list of required skills
        max_rate: Maximum acceptable hourly rate
        min_experience: Minimum years of experience required
        location: Preferred location for mentor
        languages: Comma-separated list of required languages
        min_score: Minimum recommendation score threshold
        include_paid: Whether to include mentors who charge fees
        include_free: Whether to include mentors who offer free sessions
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        RecommendationResponse with personalized mentor recommendations
        
    Raises:
        HTTPException: If recommendation generation fails
    """
    try:
        # Parse and validate filters
        filters = None
        if any([skills, max_rate, min_experience, location, languages, min_score > 0]):
            filters = RecommendationFilters(
                skills=skills.split(',') if skills else None,
                max_hourly_rate=max_rate,
                min_experience_years=min_experience,
                location=location,
                languages=languages.split(',') if languages else None,
                min_score=min_score
            )
        
        # Initialize recommendation service
        recommendation_service = RecommendationService(db)
        
        # Generate recommendations
        recommendations = recommendation_service.get_mentor_recommendations(
            user_id=current_user.id,
            limit=limit,
            filters=filters
        )
        
        # Apply pricing preferences
        if not include_paid:
            recommendations = [r for r in recommendations if r.mentor_hourly_rate == 0]
        if not include_free:
            recommendations = [r for r in recommendations if r.mentor_hourly_rate and r.mentor_hourly_rate > 0]
        
        # Get metadata for response
        total_mentors_query = select(UserProfile).where(UserProfile.is_mentor == True)
        total_mentors = len(db.exec(total_mentors_query).all())
        
        logger.info(
            f"Generated {len(recommendations)} mentor recommendations for user {current_user.id} "
            f"(filters: {filters is not None}, limit: {limit})"
        )
        
        return RecommendationResponse(
            user_id=current_user.id,
            total_mentors=total_mentors,
            filtered_mentors=len(recommendations),
            recommendations=recommendations,
            request_filters=filters
        )
        
    except ValueError as e:
        logger.warning(f"Invalid request for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to generate recommendations for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations. Please try again."
        )


@router.get("/mentors/{mentor_id}", response_model=MentorRecommendation)
async def get_mentor_recommendation_details(
    mentor_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed recommendation analysis for a specific mentor
    
    This endpoint provides detailed compatibility analysis between
    the current user and a specific mentor, including scoring breakdown
    and match explanations.
    
    Args:
        mentor_id: ID of the mentor to analyze
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Detailed mentor recommendation with scoring analysis
        
    Raises:
        HTTPException: If mentor not found or analysis fails
    """
    try:
        # Find the specified mentor
        mentor_query = select(UserProfile).where(
            UserProfile.id == mentor_id,
            UserProfile.is_mentor == True
        )
        mentor = db.exec(mentor_query).first()
        
        if not mentor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mentor with ID {mentor_id} not found"
            )
        
        # Initialize recommendation service
        recommendation_service = RecommendationService(db)
        
        # Extract user's learning profile
        user_profile = recommendation_service._extract_user_learning_profile(current_user)
        
        # Calculate detailed recommendation score
        score = recommendation_service._calculate_recommendation_score(user_profile, mentor)
        
        # Create full recommendation object
        recommendation = recommendation_service._create_mentor_recommendation(
            mentor, score, user_profile
        )
        
        logger.info(f"Generated detailed analysis for mentor {mentor_id} and user {current_user.id}")
        
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze mentor {mentor_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze mentor compatibility"
        )


@router.get("/mentors/skills/popular", response_model=List[str])
async def get_popular_mentor_skills(
    limit: int = Query(default=20, ge=5, le=50, description="Number of top skills to return"),
    db: Session = Depends(get_db)
):
    """
    Get the most common skills among mentors
    
    This endpoint analyzes all mentor profiles to identify the most
    frequently offered skills. Useful for:
    - Showing popular skills to learners
    - Filtering and search functionality
    - Platform analytics
    
    Args:
        limit: Number of top skills to return (5-50)
        db: Database session
        
    Returns:
        List of most popular skills among mentors
        
    Raises:
        HTTPException: If skill analysis fails
    """
    try:
        # Get all mentors
        mentors_query = select(UserProfile).where(UserProfile.is_mentor == True)
        mentors = db.exec(mentors_query).all()
        
        if not mentors:
            return []
        
        # Initialize recommendation service for skill parsing
        recommendation_service = RecommendationService(db)
        
        # Collect all skills from all mentors
        all_skills = []
        for mentor in mentors:
            # Parse skills and expertise
            mentor_skills = recommendation_service._parse_skills_string(mentor.skills or "")
            mentor_expertise = recommendation_service._parse_skills_string(mentor.expertise or "")
            
            # Add to collection
            all_skills.extend(mentor_skills + mentor_expertise)
        
        # Count skill frequency and get top skills
        if not all_skills:
            return []
        
        skill_counts = Counter(all_skills)
        top_skills = [skill for skill, count in skill_counts.most_common(limit)]
        
        logger.info(f"Retrieved top {len(top_skills)} mentor skills from {len(mentors)} mentors")
        
        return top_skills
        
    except Exception as e:
        logger.error(f"Failed to get popular mentor skills: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve popular skills"
        )


@router.get("/stats/overview")
async def get_recommendation_stats(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommendation system statistics
    
    Provides overview statistics about the recommendation system,
    including mentor counts, skill diversity, and system health.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Dictionary with recommendation system statistics
        
    Raises:
        HTTPException: If statistics generation fails
    """
    try:
        # Get mentor statistics
        mentors_query = select(UserProfile).where(UserProfile.is_mentor == True)
        all_mentors = db.exec(mentors_query).all()
        
        # Get learner statistics
        learners_query = select(UserProfile).where(UserProfile.is_mentor == False)
        all_learners = db.exec(learners_query).all()
        
        # Calculate pricing statistics
        paid_mentors = [m for m in all_mentors if m.hourly_rate and m.hourly_rate > 0]
        free_mentors = [m for m in all_mentors if not m.hourly_rate or m.hourly_rate == 0]
        
        # Calculate experience distribution
        experience_distribution = {}
        for mentor in all_mentors:
            if mentor.experience_years:
                if mentor.experience_years < 3:
                    category = "junior"
                elif mentor.experience_years < 7:
                    category = "mid-level"
                else:
                    category = "senior"
                experience_distribution[category] = experience_distribution.get(category, 0) + 1
        
        # Get unique skills count
        recommendation_service = RecommendationService(db)
        all_skills = set()
        for mentor in all_mentors:
            skills = recommendation_service._parse_skills_string(mentor.skills or "")
            expertise = recommendation_service._parse_skills_string(mentor.expertise or "")
            all_skills.update(skills + expertise)
        
        stats = {
            "total_mentors": len(all_mentors),
            "total_learners": len(all_learners),
            "paid_mentors": len(paid_mentors),
            "free_mentors": len(free_mentors),
            "unique_skills": len(all_skills),
            "experience_distribution": experience_distribution,
            "system_health": "healthy" if len(all_mentors) > 0 else "no_mentors"
        }
        
        logger.info(f"Generated recommendation stats for user {current_user.id}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to generate recommendation stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate system statistics"
        )