"""
Services package for SkillBridge platform

This package contains business logic services for the application,
including the core recommendation engine.
"""
from .recommendation_service import RecommendationService

__all__ = ["RecommendationService"]