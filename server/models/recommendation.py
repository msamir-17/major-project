"""
Recommendation models for SkillBridge platform

This module contains all Pydantic models related to the mentor recommendation system,
including scoring, filtering, and response models.
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from enum import Enum


class MatchType(str, Enum):
    """Types of matches between users and mentors"""
    SKILLS = "skills"
    LOCATION = "location" 
    LANGUAGE = "language"
    EXPERIENCE = "experience"
    AVAILABILITY = "availability"
    LEARNING_STYLE = "learning_style"


class RecommendationScore(BaseModel):
    """
    Score breakdown for a mentor recommendation
    
    All scores are normalized to 0-100 scale for consistency
    """
    total_score: float = Field(..., ge=0, le=100, description="Total recommendation score (0-100)")
    skills_match: float = Field(default=0, ge=0, le=100, description="Skills compatibility score")
    location_match: float = Field(default=0, ge=0, le=100, description="Location proximity score")
    language_match: float = Field(default=0, ge=0, le=100, description="Language compatibility score")
    experience_match: float = Field(default=0, ge=0, le=100, description="Experience level match")
    availability_match: float = Field(default=0, ge=0, le=100, description="Availability overlap score")
    learning_style_match: float = Field(default=0, ge=0, le=100, description="Learning style compatibility")


class MentorRecommendation(BaseModel):
    """
    Complete mentor recommendation with profile data and match analysis
    
    Contains both mentor profile information and recommendation-specific data
    like scoring and match reasons.
    """
    # Mentor profile data
    mentor_id: int = Field(..., description="Mentor's user ID")
    mentor_name: str = Field(..., description="Mentor's full name")
    mentor_email: str = Field(..., description="Mentor's email")
    mentor_bio: Optional[str] = Field(None, description="Mentor's bio")
    mentor_location: Optional[str] = Field(None, description="Mentor's location")
    mentor_skills: Optional[str] = Field(None, description="Mentor's skills")
    mentor_expertise: Optional[str] = Field(None, description="Mentor's expertise areas")
    mentor_experience_years: Optional[int] = Field(None, description="Years of experience")
    mentor_languages: Optional[str] = Field(None, description="Languages spoken")
    mentor_hourly_rate: Optional[float] = Field(None, description="Hourly rate")
    mentor_availability: Optional[str] = Field(None, description="Availability schedule")
    mentor_company: Optional[str] = Field(None, description="Current company")
    mentor_job_title: Optional[str] = Field(None, description="Job title")
    mentor_linkedin_url: Optional[str] = Field(None, description="LinkedIn profile")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")
    
    # Recommendation analysis
    recommendation_score: RecommendationScore = Field(..., description="Detailed scoring breakdown")
    match_reasons: List[str] = Field(default_factory=list, description="Human-readable reasons for this match")
    common_skills: List[str] = Field(default_factory=list, description="Skills in common with user")


class RecommendationFilters(BaseModel):
    """
    Optional filters to apply when requesting mentor recommendations
    
    All filters are optional and can be combined for refined results.
    """
    skills: Optional[List[str]] = Field(None, description="Filter by specific skills")
    max_hourly_rate: Optional[float] = Field(None, ge=0, description="Maximum hourly rate")
    min_experience_years: Optional[int] = Field(None, ge=0, description="Minimum years of experience")
    location: Optional[str] = Field(None, description="Preferred location")
    languages: Optional[List[str]] = Field(None, description="Required languages")
    availability: Optional[str] = Field(None, description="Availability requirements")
    min_score: Optional[float] = Field(default=0, ge=0, le=100, description="Minimum recommendation score")


class RecommendationResponse(BaseModel):
    """
    Complete response for mentor recommendation requests
    
    Includes metadata about the recommendation process and the actual recommendations.
    """
    user_id: int = Field(..., description="ID of the requesting user")
    total_mentors: int = Field(..., description="Total number of available mentors")
    filtered_mentors: int = Field(..., description="Number of mentors after filtering")
    recommendations: List[MentorRecommendation] = Field(..., description="List of recommended mentors")
    request_filters: Optional[RecommendationFilters] = Field(None, description="Applied filters")


class UserLearningProfile(BaseModel):
    """
    Extracted learning profile from user data for matching algorithm
    
    This internal model normalizes user data for the recommendation engine.
    """
    skills_interested: List[str] = Field(default_factory=list, description="Skills user wants to learn")
    current_skills: List[str] = Field(default_factory=list, description="Skills user already has")
    learning_goals: Optional[str] = Field(None, description="User's learning objectives")
    experience_level: Optional[str] = Field(None, description="User's experience level")
    learning_style: Optional[str] = Field(None, description="Preferred learning approach")
    preferred_languages: List[str] = Field(default_factory=list, description="Languages user speaks")
    location: Optional[str] = Field(None, description="User's location")
    availability: Optional[str] = Field(None, description="User's availability")
    budget_range: Optional[Dict[str, float]] = Field(None, description="User's budget preferences")