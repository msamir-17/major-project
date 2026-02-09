"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMentorRecommendations } from "@/hooks/useRecommendation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star, MapPin, Clock, DollarSign, User, Filter } from "lucide-react";
import SessionBooking from "./SessionBooking"; // Import our new compone
import { div } from "framer-motion/client";

export default function FindMentorsPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const { user, isAuthenticated ,isLoading:isAuthLoading  } = useAuth();
  const router = useRouter();
  const { recommendations, isLoading, error, fetchRecommendations } = useMentorRecommendations();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    max_hourly_rate: undefined as number | undefined,
    min_experience_years: undefined as number | undefined,
    location: "",
    languages: [] as string[],
    availability: "",
    min_score: 0,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBookingOpen(false);
      }
    };

    if (isBookingOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBookingOpen]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRecommendations(10, filters);
    }
  }, [isAuthenticated, user, fetchRecommendations]);

  const handleApplyFilters = () => {
    fetchRecommendations(10, filters);
    setShowFilters(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (isAuthLoading) {
          return (
            <div className="text-center py-8">
              <p>Authenticating...</p>
            </div>
          );
        }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Find Mentors</h1>
          <p>Please log in to view mentor recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Find Your Perfect Mentor</h1>
          <p className="text-gray-600 mt-2">
            Personalized mentor recommendations based on your learning goals
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Mentors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Hourly Rate
                </label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  className="w-full p-2 border rounded"
                  value={filters.max_hourly_rate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      max_hourly_rate: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 3"
                  className="w-full p-2 border rounded"
                  value={filters.min_experience_years || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      min_experience_years: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., San Francisco"
                  className="w-full p-2 border rounded"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    skills: [],
                    max_hourly_rate: undefined,
                    min_experience_years: undefined,
                    location: "",
                    languages: [],
                    availability: "",
                    min_score: 0,
                  });
                  fetchRecommendations(10);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding your perfect mentors...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => fetchRecommendations(10)} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Recommendations */}
      {!isLoading && !error && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((mentor) => (
            <Card
              key={mentor.mentor_id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {mentor.mentor_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {mentor.mentor_job_title}
                      </p>
                      {mentor.mentor_company && (
                        <p className="text-xs text-gray-500">
                          {mentor.mentor_company}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={getScoreBadgeVariant(
                      mentor.recommendation_score.total_score,
                    )}
                  >
                    {mentor.recommendation_score.total_score.toFixed(0)}% Match
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {mentor.mentor_bio && (
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {mentor.mentor_bio}
                  </p>
                )}

                {/* Location & Experience */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {mentor.mentor_location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{mentor.mentor_location}</span>
                    </div>
                  )}
                  {mentor.mentor_experience_years && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{mentor.mentor_experience_years}+ years</span>
                    </div>
                  )}
                </div>

                {/* Hourly Rate */}
                {mentor.mentor_hourly_rate !== undefined && (
                  <div className="flex items-center space-x-1 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">
                      {mentor.mentor_hourly_rate === 0
                        ? "Free"
                        : `$${mentor.mentor_hourly_rate}/hour`}
                    </span>
                  </div>
                )}

                {/* Common Skills */}
                {mentor.common_skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Skills Match:</p>
                    <div className="flex flex-wrap gap-1">
                      {mentor.common_skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {mentor.common_skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.common_skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Match Reasons */}
                {mentor.match_reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Why this match:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {mentor.match_reasons.slice(0, 3).map((reason, index) => (
                        <li key={index} className="flex items-start space-x-1">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Score Breakdown */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Skills:</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.skills_match,
                        )}
                      >
                        {mentor.recommendation_score.skills_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.location_match,
                        )}
                      >
                        {mentor.recommendation_score.location_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Language:</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.language_match,
                        )}
                      >
                        {mentor.recommendation_score.language_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience:</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.experience_match,
                        )}
                      >
                        {mentor.recommendation_score.experience_match.toFixed(
                          0,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => router.push(`/chat/${mentor.mentor_id}`)}
                    className="flex-1"
                    size="sm"
                  >
                    Message
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedMentor({
                        id: mentor.mentor_id,
                        name: mentor.mentor_name,
                      });
                      setIsBookingOpen(true);
                    }}
                    className="flex-1"
                    size="sm"
                    variant="outline"
                  >
                    Book Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No mentors found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or update your learning preferences in
            your profile.
          </p>
          <Button onClick={() => fetchRecommendations(10)}>
            Refresh Recommendations
          </Button>
        </div>
      )}
      {isBookingOpen && selectedMentor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation}
            className="bg-card rounded-lg shadow-2xl w-full max-w-md relative animate-in fade-in-0 zoom-in-95"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-2 right-2 rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <SessionBooking
              mentorId={selectedMentor.id}
              mentorName={selectedMentor.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
