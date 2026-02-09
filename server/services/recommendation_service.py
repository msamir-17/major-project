"""
Recommendation service for SkillBridge platform

This service implements the core recommendation algorithm that matches
learners with mentors based on skills, experience, location, and other factors.
"""
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from difflib import SequenceMatcher
import logging

from models import UserProfile
from models.recommendation import (
    MentorRecommendation,
    RecommendationScore,
    RecommendationFilters,
    UserLearningProfile
)

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Core recommendation service for matching learners with mentors
    
    This service implements a sophisticated matching algorithm that considers
    multiple factors to recommend the most suitable mentors for each learner.
    """
    
    # Scoring weights for different matching factors
    SCORING_WEIGHTS = {
        'skills': 0.4,        # 40% - Most important factor
        'language': 0.2,      # 20% - Communication is critical  
        'experience': 0.15,   # 15% - Good experience match
        'location': 0.1,      # 10% - Less important (remote possible)
        'availability': 0.1,  # 10% - Can be negotiated
        'learning_style': 0.05 # 5% - Least critical
    }
    
    def __init__(self, db: Session):
        """
        Initialize the recommendation service
        
        Args:
            db: Database session for data access
        """
        self.db = db
    
    def get_mentor_recommendations(
        self, 
        user_id: int, 
        limit: int = 10,
        filters: Optional[RecommendationFilters] = None
    ) -> List[MentorRecommendation]:
        """
        Get personalized mentor recommendations for a user
        
        Args:
            user_id: ID of the user requesting recommendations
            limit: Maximum number of recommendations to return
            filters: Optional filters to apply to recommendations
            
        Returns:
            List of mentor recommendations sorted by compatibility score
            
        Raises:
            ValueError: If user not found or invalid parameters
        """
        try:
            # Get the requesting user
            user = self.db.exec(select(UserProfile).where(UserProfile.id == user_id)).first()
            if not user:
                raise ValueError(f"User with ID {user_id} not found")
            
            if user.is_mentor:
                raise ValueError("Cannot generate mentor recommendations for mentor accounts")
            
            # Extract user's learning profile
            user_profile = self._extract_user_learning_profile(user)
            
            # Get all available mentors
            mentors_query = select(UserProfile).where(UserProfile.is_mentor == True)
            mentors = self.db.exec(mentors_query).all()
            
            if not mentors:
                logger.warning("No mentors available in the system")
                return []
            
            # Apply filters if provided
            if filters:
                mentors = self._apply_filters(mentors, filters)
            
            # Generate recommendations for each mentor
            recommendations = []
            for mentor in mentors:
                # Calculate recommendation score
                score = self._calculate_recommendation_score(user_profile, mentor)
                
                # Apply minimum score filter
                if filters and filters.min_score and score.total_score < filters.min_score:
                    continue
                
                # Create recommendation object
                recommendation = self._create_mentor_recommendation(mentor, score, user_profile)
                recommendations.append(recommendation)
            
            # Sort by total score (highest first) and limit results
            recommendations.sort(key=lambda x: x.recommendation_score.total_score, reverse=True)
            
            logger.info(f"Generated {len(recommendations[:limit])} recommendations for user {user_id}")
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Failed to generate recommendations for user {user_id}: {str(e)}")
            raise
    
    def _extract_user_learning_profile(self, user: UserProfile) -> UserLearningProfile:
        """
        Extract and normalize user learning profile for matching
        
        Args:
            user: User profile from database
            
        Returns:
            Normalized learning profile for recommendation algorithm
        """
        return UserLearningProfile(
            skills_interested=self._parse_skills_string(user.skills_interested or ""),
            current_skills=self._parse_skills_string(user.current_skills or ""),
            learning_goals=user.learning_goal,
            experience_level=user.experience_level,
            learning_style=user.learning_style,
            preferred_languages=self._parse_skills_string(user.preferred_language or "English"),
            location=user.location,
            availability=user.availability
        )
    
    def _calculate_recommendation_score(
        self, 
        user_profile: UserLearningProfile, 
        mentor: UserProfile
    ) -> RecommendationScore:
        """
        Calculate detailed compatibility score between user and mentor
        
        Args:
            user_profile: User's learning profile
            mentor: Mentor's profile
            
        Returns:
            Detailed recommendation score breakdown
        """
        # Skills matching (40% weight)
        skills_score = self._calculate_skills_match(user_profile, mentor)
        
        # Language matching (20% weight)  
        language_score = self._calculate_language_match(user_profile, mentor)
        
        # Experience matching (15% weight)
        experience_score = self._calculate_experience_match(user_profile, mentor)
        
        # Location matching (10% weight)
        location_score = self._calculate_location_match(user_profile, mentor)
        
        # Availability matching (10% weight)
        availability_score = self._calculate_availability_match(user_profile, mentor)
        
        # Learning style matching (5% weight)
        learning_style_score = self._calculate_learning_style_match(user_profile, mentor)
        
        # Calculate weighted total score
        total_score = (
            skills_score * self.SCORING_WEIGHTS['skills'] +
            language_score * self.SCORING_WEIGHTS['language'] +
            experience_score * self.SCORING_WEIGHTS['experience'] +
            location_score * self.SCORING_WEIGHTS['location'] +
            availability_score * self.SCORING_WEIGHTS['availability'] +
            learning_style_score * self.SCORING_WEIGHTS['learning_style']
        )
        
        return RecommendationScore(
            total_score=round(total_score, 2),
            skills_match=round(skills_score, 2),
            location_match=round(location_score, 2),
            language_match=round(language_score, 2),
            experience_match=round(experience_score, 2),
            availability_match=round(availability_score, 2),
            learning_style_match=round(learning_style_score, 2)
        )
    
    def _calculate_skills_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate skills compatibility score (0-100)"""
        if not user_profile.skills_interested:
            return 50.0  # Neutral score if no skills specified
        
        # Get mentor's skills and expertise
        mentor_skills = self._parse_skills_string(mentor.skills or "")
        mentor_expertise = self._parse_skills_string(mentor.expertise or "")
        all_mentor_skills = mentor_skills + mentor_expertise
        
        if not all_mentor_skills:
            return 20.0  # Low score if mentor has no skills listed
        
        # Calculate overlap using fuzzy matching
        total_matches = 0
        for user_skill in user_profile.skills_interested:
            best_match = 0
            for mentor_skill in all_mentor_skills:
                similarity = SequenceMatcher(None, user_skill.lower(), mentor_skill.lower()).ratio()
                if similarity > best_match:
                    best_match = similarity
            
            # Consider it a match if similarity > 0.7 (70%)
            if best_match > 0.7:
                total_matches += best_match
        
        # Calculate percentage score
        if len(user_profile.skills_interested) == 0:
            return 50.0
        
        score = (total_matches / len(user_profile.skills_interested)) * 100
        return min(100.0, score)
    
    def _calculate_language_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate language compatibility score (0-100)"""
        if not user_profile.preferred_languages:
            return 90.0  # Assume English if not specified
        
        mentor_languages = self._parse_skills_string(mentor.languages_spoken or "English")
        
        # Check for exact matches
        for user_lang in user_profile.preferred_languages:
            for mentor_lang in mentor_languages:
                if user_lang.lower() in mentor_lang.lower() or mentor_lang.lower() in user_lang.lower():
                    return 100.0
        
        # Default to medium compatibility if no exact match
        return 60.0
    
    def _calculate_experience_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate experience level compatibility score (0-100)"""
        if not mentor.experience_years:
            return 50.0  # Neutral if no experience specified
        
        # Experience matching logic based on user's level
        if user_profile.experience_level:
            level = user_profile.experience_level.lower()
            if "beginner" in level or "entry" in level:
                # Beginners benefit from any experienced mentor
                return min(100.0, (mentor.experience_years / 3) * 100)
            elif "intermediate" in level or "mid" in level:
                # Intermediate learners need moderately experienced mentors
                if 3 <= mentor.experience_years <= 8:
                    return 100.0
                elif mentor.experience_years > 8:
                    return 85.0
                else:
                    return 60.0
            elif "advanced" in level or "senior" in level:
                # Advanced learners need very experienced mentors
                return min(100.0, (mentor.experience_years / 10) * 100)
        
        # Default scoring based on experience years
        if mentor.experience_years >= 5:
            return 90.0
        elif mentor.experience_years >= 2:
            return 75.0
        else:
            return 60.0
    
    def _calculate_location_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate location proximity score (0-100)"""
        if not user_profile.location or not mentor.location:
            return 70.0  # Neutral score for remote mentoring
        
        user_loc = user_profile.location.lower()
        mentor_loc = mentor.location.lower()
        
        # Exact match
        if user_loc == mentor_loc:
            return 100.0
        
        # City/state matches
        user_parts = set(user_loc.split())
        mentor_parts = set(mentor_loc.split())
        
        if user_parts & mentor_parts:
            return 85.0
        
        # Country/region matches (simplified)
        similarity = SequenceMatcher(None, user_loc, mentor_loc).ratio()
        return max(50.0, similarity * 100)
    
    def _calculate_availability_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate availability overlap score (0-100)"""
        if not user_profile.availability or not mentor.mentor_availability:
            return 70.0  # Neutral score if availability not specified
        
        user_avail = user_profile.availability.lower()
        mentor_avail = mentor.mentor_availability.lower()
        
        # Simple keyword matching for availability
        common_times = ["morning", "afternoon", "evening", "weekday", "weekend", "flexible"]
        matches = 0
        
        for time_slot in common_times:
            if time_slot in user_avail and time_slot in mentor_avail:
                matches += 1
        
        base_score = 50.0
        bonus = (matches / len(common_times)) * 50.0
        
        return min(100.0, base_score + bonus)
    
    def _calculate_learning_style_match(self, user_profile: UserLearningProfile, mentor: UserProfile) -> float:
        """Calculate learning style compatibility score (0-100)"""
        # This is a simplified implementation
        # In a real system, you'd have more sophisticated matching logic
        return 70.0  # Default good compatibility score
    
    def _create_mentor_recommendation(
        self, 
        mentor: UserProfile, 
        score: RecommendationScore, 
        user_profile: UserLearningProfile
    ) -> MentorRecommendation:
        """
        Create a complete mentor recommendation object
        
        Args:
            mentor: Mentor profile
            score: Calculated compatibility score
            user_profile: User's learning profile
            
        Returns:
            Complete mentor recommendation with all details
        """
        # Generate human-readable match reasons
        match_reasons = []
        
        if score.skills_match > 80:
            match_reasons.append("Strong skills alignment with your learning goals")
        if score.experience_match > 85:
            match_reasons.append(f"Excellent experience level ({mentor.experience_years}+ years)")
        if score.location_match > 80:
            match_reasons.append("Located in your preferred area or timezone")
        if score.language_match > 90:
            match_reasons.append("Speaks your preferred language fluently")
        if mentor.hourly_rate == 0:
            match_reasons.append("Offers free mentoring sessions")
        elif mentor.hourly_rate and mentor.hourly_rate < 100:
            match_reasons.append("Competitive and affordable hourly rate")
        if mentor.company:
            match_reasons.append(f"Works at {mentor.company}")
        
        # Find common skills
        common_skills = []
        if user_profile.skills_interested and mentor.skills:
            user_skills = [s.lower().strip() for s in user_profile.skills_interested]
            mentor_skills = self._parse_skills_string(mentor.skills)
            mentor_expertise = self._parse_skills_string(mentor.expertise or "")
            all_mentor_skills = mentor_skills + mentor_expertise
            
            for user_skill in user_skills:
                for mentor_skill in all_mentor_skills:
                    if (user_skill in mentor_skill.lower() or 
                        SequenceMatcher(None, user_skill, mentor_skill.lower()).ratio() > 0.8):
                        if mentor_skill not in common_skills:
                            common_skills.append(mentor_skill)
        
        return MentorRecommendation(
            mentor_id=mentor.id,
            mentor_name=mentor.full_name,
            mentor_email=mentor.email,
            mentor_bio=mentor.bio,
            mentor_location=mentor.location,
            mentor_skills=mentor.skills,
            mentor_expertise=mentor.expertise,
            mentor_experience_years=mentor.experience_years,
            mentor_languages=mentor.languages_spoken,
            mentor_hourly_rate=mentor.hourly_rate,
            mentor_availability=mentor.mentor_availability,
            mentor_company=mentor.company,
            mentor_job_title=mentor.job_title,
            mentor_linkedin_url=mentor.linkedin_url,
            profile_picture_url=mentor.profile_picture_url,
            recommendation_score=score,
            match_reasons=match_reasons[:5],  # Limit to top 5 reasons
            common_skills=common_skills[:5]   # Limit to top 5 skills
        )
    
    def _apply_filters(self, mentors: List[UserProfile], filters: RecommendationFilters) -> List[UserProfile]:
        """
        Apply filters to mentor list
        
        Args:
            mentors: List of mentor profiles
            filters: Filters to apply
            
        Returns:
            Filtered list of mentors
        """
        filtered_mentors = mentors
        
        if filters.max_hourly_rate is not None:
            filtered_mentors = [
                m for m in filtered_mentors 
                if not m.hourly_rate or m.hourly_rate <= filters.max_hourly_rate
            ]
        
        if filters.min_experience_years is not None:
            filtered_mentors = [
                m for m in filtered_mentors 
                if m.experience_years and m.experience_years >= filters.min_experience_years
            ]
        
        if filters.location:
            location_filter = filters.location.lower()
            filtered_mentors = [
                m for m in filtered_mentors 
                if m.location and location_filter in m.location.lower()
            ]
        
        if filters.skills:
            skill_filters = [s.lower().strip() for s in filters.skills]
            filtered_mentors = [
                m for m in filtered_mentors 
                if m.skills and any(
                    skill_filter in m.skills.lower() 
                    for skill_filter in skill_filters
                )
            ]
        
        return filtered_mentors
    
    def _parse_skills_string(self, skills_str: str) -> List[str]:
        """
        Parse comma-separated skills string into normalized list
        
        Args:
            skills_str: Comma-separated skills string
            
        Returns:
            List of normalized skill strings
        """
        if not skills_str:
            return []
        
        # Split by comma and normalize
        skills = [skill.strip() for skill in skills_str.split(',') if skill.strip()]
        
        # Remove duplicates while preserving order
        seen = set()
        normalized_skills = []
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower not in seen:
                seen.add(skill_lower)
                normalized_skills.append(skill)
        
        return normalized_skills