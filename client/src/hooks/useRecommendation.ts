import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MentorRecommendation {
  mentor_id: number;
  mentor_name: string;
  mentor_email: string;
  mentor_bio?: string;
  mentor_location?: string;
  mentor_skills?: string;
  mentor_expertise?: string;
  mentor_experience_years?: number;
  mentor_languages?: string;
  mentor_hourly_rate?: number;
  mentor_availability?: string;
  mentor_company?: string;
  mentor_job_title?: string;
  mentor_linkedin_url?: string;
  profile_picture_url?: string;
  recommendation_score: {
    total_score: number;
    skills_match: number;
    location_match: number;
    language_match: number;
    experience_match: number;
    availability_match: number;
    learning_style_match: number;
  };
  match_reasons: string[];
  common_skills: string[];
}

interface RecommendationFilters {
  skills?: string[];
  max_hourly_rate?: number;
  min_experience_years?: number;
  location?: string;
  languages?: string[];
  availability?: string;
  min_score?: number;
}

export const useMentorRecommendations = () => {
  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecommendations = useCallback(async (
    limit: number = 10,
    filters?: RecommendationFilters
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("auth_token");
      
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        ...(filters?.skills && { skills: filters.skills.join(',') }),
        ...(filters?.max_hourly_rate && { max_hourly_rate: filters.max_hourly_rate.toString() }),
        ...(filters?.min_experience_years && { min_experience_years: filters.min_experience_years.toString() }),
        ...(filters?.location && { location: filters.location }),
        ...(filters?.languages && { languages: filters.languages.join(',') }),
        ...(filters?.availability && { availability: filters.availability }),
        ...(filters?.min_score && { min_score: filters.min_score.toString() })
      });

      const response = await fetch(`${API_URL}/api/recommendations/mentors?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
  };
};