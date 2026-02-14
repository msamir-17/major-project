import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface MentorRecommendation {
  id: number; // Was mentor_id
  full_name: string; // Was mentor_name
  email: string; // Was mentor_email
  bio?: string; // Was mentor_bio
  location?: string; // Was mentor_location
  skills?: string; // Was mentor_skills
  expertise?: string; // Was mentor_expertise
  experience_years?: number; // Was mentor_experience_years
  languages_spoken?: string; // Was mentor_languages
  hourly_rate?: number; // Was mentor_hourly_rate
  availability?: string; // Was mentor_availability
  company?: string; // Was mentor_company
  job_title?: string; // Was mentor_job_title
  linkedin_url?: string; // Was mentor_linkedin_url
  profile_picture_url?: string;

  mentor_location?: string;
  mentor_skills?: string;
  mentor_expertise?: string;
  mentor_experience_years?: number;
  mentor_languages?: string;
  mentor_hourly_rate?: number;
  mentor_availability?: string;
  mentor_company?: string;

  mentor_linkedin_url?: string;
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
  const [recommendations, setRecommendations] = useState<
    MentorRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecommendations = useCallback(
    async (limit: number = 10, filters?: RecommendationFilters) => {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("auth_token");

        const queryParams = new URLSearchParams({
          limit: limit.toString(),
        });

        if (filters) {
          if (filters.skills && filters.skills.length > 0) {
            queryParams.append('skills', filters.skills.join(','));
          }
          if (filters.max_hourly_rate !== undefined) {
            queryParams.append('max_hourly_rate', filters.max_hourly_rate.toString());
          }
          if (filters.min_experience_years !== undefined) {
            queryParams.append('min_experience_years', filters.min_experience_years.toString());
          }
          if (filters.location) {
            queryParams.append('location', filters.location);
          }
          if (filters.languages && filters.languages.length > 0) {
            queryParams.append('languages', filters.languages.join(','));
          }
          if (filters.min_score) {
            queryParams.append('min_score', filters.min_score.toString());
          }
        }

        const response = await fetch(`${API_URL}/api/recommendations/mentors?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch recommendations: ${response.statusText}`,
          );
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch recommendations",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
  };
};
