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
import UserDashboardButton from "@/components/UserDashboardButton";
import { useI18n } from "@/context/I18nContext";

type MentorListItem = {
  id: number;
  full_name: string;
  email: string;
  bio?: string;
  location?: string;
  skills?: string;
  expertise?: string;
  experience_years?: number;
  hourly_rate?: number;
  company?: string;
  job_title?: string;
};

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
  const { t, language } = useI18n();

  const [translatedBioByMentorId, setTranslatedBioByMentorId] = useState<Record<number, string>>({});
  const [isTranslatingBioByMentorId, setIsTranslatingBioByMentorId] = useState<Record<number, boolean>>({});
  const [showOriginalBioByMentorId, setShowOriginalBioByMentorId] = useState<Record<number, boolean>>({});

  const [translatedReasonsByMentorId, setTranslatedReasonsByMentorId] = useState<Record<number, string[]>>({});
  const [isTranslatingReasonsByMentorId, setIsTranslatingReasonsByMentorId] = useState<Record<number, boolean>>({});
  const [showOriginalReasonsByMentorId, setShowOriginalReasonsByMentorId] = useState<Record<number, boolean>>({});

  const [viewMode, setViewMode] = useState<"recommended" | "all">("recommended");
  const [allMentors, setAllMentors] = useState<MentorListItem[]>([]);
  const [isAllMentorsLoading, setIsAllMentorsLoading] = useState(false);
  const [allMentorsError, setAllMentorsError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    skills: [] as string[],
    max_hourly_rate: undefined as number | undefined,
    min_experience_years: undefined as number | undefined,
    location: "",
    languages: [] as string[],
    availability: "",
    min_score: 0,
  });

  const extractDetail = (detail: unknown, fallback: string) => {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(String).join(", ") || fallback;
    if (detail != null) {
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const getApiErrorMessage = (data: any, fallback: string) => {
    const detail = data?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) return detail;
    if (Array.isArray(detail)) {
      const msg = detail
        .map((d) => (typeof d === "string" ? d : d?.msg || JSON.stringify(d)))
        .filter(Boolean)
        .join(", ");
      if (msg.trim().length > 0) return msg;
    }
    if (detail != null) {
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const translateMentorReasons = async (mentorId: number, reasons: string[]) => {
    const lines = (reasons || []).map((r) => String(r || "").trim()).filter(Boolean);
    if (lines.length === 0) return;

    setIsTranslatingReasonsByMentorId((prev) => ({ ...prev, [mentorId]: true }));
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error(t("mentors.auth_required"));
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const targetLanguage = language === "hi" ? "Hindi" : language === "es" ? "Spanish" : "English";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: {
          ...headers,
        },
        body: JSON.stringify({
          text: lines.join("\n"),
          target_language: targetLanguage,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || `Failed to translate (${res.status})`);
      }

      const translated = String(data?.translated_text || "").trim();
      if (!translated) throw new Error("Failed to translate");

      const translatedLines = translated
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      setTranslatedReasonsByMentorId((prev) => ({ ...prev, [mentorId]: translatedLines }));
      setShowOriginalReasonsByMentorId((prev) => ({ ...prev, [mentorId]: false }));
    } catch (e) {
      setTranslatedReasonsByMentorId((prev) => ({
        ...prev,
        [mentorId]: [e instanceof Error ? e.message : "Failed to translate"],
      }));
    } finally {
      setIsTranslatingReasonsByMentorId((prev) => ({ ...prev, [mentorId]: false }));
    }
  };

  const toBadges = (value?: string) => {
    if (!value) return [] as string[];
    return String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const translateMentorBio = async (mentorId: number, text: string) => {
    const clean = String(text || "").trim();
    if (!clean) return;

    setIsTranslatingBioByMentorId((prev) => ({ ...prev, [mentorId]: true }));
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error(t("mentors.auth_required"));
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const targetLanguage = language === "hi" ? "Hindi" : language === "es" ? "Spanish" : "English";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: {
          ...headers,
        },
        body: JSON.stringify({
          text: clean,
          target_language: targetLanguage,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || `Failed to translate (${res.status})`);
      }

      const translated = String(data?.translated_text || "").trim();
      if (!translated) throw new Error("Failed to translate");

      setTranslatedBioByMentorId((prev) => ({ ...prev, [mentorId]: translated }));
      setShowOriginalBioByMentorId((prev) => ({ ...prev, [mentorId]: false }));
    } catch (e) {
      setTranslatedBioByMentorId((prev) => ({
        ...prev,
        [mentorId]: e instanceof Error ? e.message : "Failed to translate",
      }));
    } finally {
      setIsTranslatingBioByMentorId((prev) => ({ ...prev, [mentorId]: false }));
    }
  };

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

  const fetchAllMentors = async () => {
    setIsAllMentorsLoading(true);
    setAllMentorsError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_URL}/api/users/mentors`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const fallback = `Failed to fetch mentors (${response.status})${response.statusText ? `: ${response.statusText}` : ""}`;
        throw new Error(getApiErrorMessage(data, fallback));
      }

      setAllMentors(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e instanceof Error) {
        setAllMentorsError(e.message);
      } else {
        try {
          setAllMentorsError(JSON.stringify(e));
        } catch {
          setAllMentorsError("Failed to fetch mentors");
        }
      }
      setAllMentors([]);
    } finally {
      setIsAllMentorsLoading(false);
    }
  };

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
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("mentors.find_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("mentors.auth_required")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => router.push('/login')}>{t("common.login")}</Button>
              <Button variant="outline" onClick={() => router.push('/register')}>{t("common.register")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sticky top-0 z-40 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-sm border-b border-border mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("mentors.find_title")}</h1>
            <p className="text-gray-600 mt-2">{t("mentors.find_subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UserDashboardButton />

            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              onClick={async () => {
                if (viewMode !== "all") {
                  setViewMode("all");
                  if (allMentors.length === 0) {
                    await fetchAllMentors();
                  }
                } else {
                  setViewMode("recommended");
                }
              }}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              {t("mentors.all")}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              disabled={viewMode === "all"}
            >
              <Filter className="w-4 h-4" />
              {t("common.filters")}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle>{t("mentors.filter_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("mentors.filter.max_rate")}
                </label>
                <input
                  type="number"
                  placeholder={t("mentors.filter.max_rate_placeholder")}
                  className="w-full p-2 border rounded-md bg-background"
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
                  {t("mentors.filter.min_experience")}
                </label>
                <input
                  type="number"
                  placeholder={t("mentors.filter.min_experience_placeholder")}
                  className="w-full p-2 border rounded-md bg-background"
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
                  {t("mentors.filter.location")}
                </label>
                <input
                  type="text"
                  placeholder={t("mentors.filter.location_placeholder")}
                  className="w-full p-2 border rounded-md bg-background"
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
              <Button onClick={handleApplyFilters}>{t("common.apply")}</Button>
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
                {t("common.clear")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("mentors.finding")}</p>
        </div>
      )}

      {/* All Mentors */}
      {viewMode === "all" && (
        <>
          {isAllMentorsLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t("mentors.loading")}</p>
            </div>
          )}

          {allMentorsError && !isAllMentorsLoading && (
            <div className="text-center py-8">
              <p className="text-red-600">{allMentorsError}</p>
              <Button onClick={fetchAllMentors} className="mt-4">
                {t("common.try_again")}
              </Button>
            </div>
          )}

          {!isAllMentorsLoading && !allMentorsError && allMentors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {allMentors.map((mentor) => (
                <Card key={mentor.id} className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{mentor.full_name}</CardTitle>
                          {mentor.job_title && (
                            <p className="text-sm text-gray-600">{mentor.job_title}</p>
                          )}
                          {mentor.company && (
                            <p className="text-xs text-gray-500">{mentor.company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {mentor.bio && (
                      <div>
                        <p className="text-sm text-gray-700 line-clamp-3">{mentor.bio}</p>

                        <div className="mt-1">
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                            onClick={() => translateMentorBio(mentor.id, mentor.bio || "")}
                            disabled={!!isTranslatingBioByMentorId[mentor.id]}
                          >
                            {isTranslatingBioByMentorId[mentor.id] ? t("chat.translating") : t("chat.translate")}
                          </button>

                          {translatedBioByMentorId[mentor.id] ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {translatedBioByMentorId[mentor.id]}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {mentor.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{mentor.location}</span>
                        </div>
                      )}
                      {mentor.experience_years && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{t("mentors.years", { years: String(mentor.experience_years) })}</span>
                        </div>
                      )}
                    </div>

                    {mentor.hourly_rate !== undefined && (
                      <div className="flex items-center space-x-1 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {mentor.hourly_rate === 0
                            ? t("mentors.free")
                            : t("mentors.per_hour", { rate: String(mentor.hourly_rate) })}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const expertise = toBadges(mentor.expertise).slice(0, 2);
                      const skills = toBadges(mentor.skills).slice(0, 4);
                      const badges = [...expertise.map((t) => ({ t, v: "secondary" as const })), ...skills.map((t) => ({ t, v: "outline" as const }))];
                      if (badges.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1">
                          {badges.map((b, idx) => (
                            <Badge key={`${b.t}-${idx}`} variant={b.v} className="text-xs">
                              {b.t}
                            </Badge>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="flex space-x-2 pt-4 mt-auto">
                      <Button
                        onClick={() => router.push(`/chat/${mentor.id}`)}
                        className="flex-1"
                        size="sm"
                      >
                        {t("mentors.message")}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedMentor({ id: mentor.id, name: mentor.full_name });
                          setIsBookingOpen(true);
                        }}
                        className="flex-1"
                        size="sm"
                        variant="outline"
                      >
                        {t("mentors.book_session")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isAllMentorsLoading && !allMentorsError && allMentors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <User className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("mentors.none_found")}
              </h3>
              <Button onClick={fetchAllMentors}>
                {t("common.refresh")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => fetchRecommendations(10)} className="mt-4">
            {t("common.try_again")}
          </Button>
        </div>
      )}

      {/* Recommendations */}
      {viewMode === "recommended" && !isLoading && !error && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((mentor) => (
            <Card
              key={mentor.id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {mentor.full_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {mentor.job_title}
                      </p>
                      {(mentor.company || mentor.mentor_company) && (
                        <p className="text-xs text-gray-500">
                          {mentor.company || mentor.mentor_company}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={getScoreBadgeVariant(
                      mentor.recommendation_score.total_score,
                    )}
                  >
                    {t("mentors.match", { pct: mentor.recommendation_score.total_score.toFixed(0) })}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {(mentor.bio || mentor.mentor_bio) && (
                  <div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {translatedBioByMentorId[mentor.id] && !showOriginalBioByMentorId[mentor.id]
                        ? translatedBioByMentorId[mentor.id]
                        : (mentor.bio || mentor.mentor_bio)}
                    </p>

                    <div className="mt-1">
                      {translatedBioByMentorId[mentor.id] ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                          onClick={() =>
                            setShowOriginalBioByMentorId((prev) => ({
                              ...prev,
                              [mentor.id]: !prev[mentor.id],
                            }))
                          }
                        >
                          {showOriginalBioByMentorId[mentor.id]
                            ? t("common.see_translation")
                            : t("common.show_original")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                          onClick={() => translateMentorBio(mentor.id, String(mentor.bio || mentor.mentor_bio || ""))}
                          disabled={!!isTranslatingBioByMentorId[mentor.id]}
                        >
                          {isTranslatingBioByMentorId[mentor.id] ? t("chat.translating") : t("chat.translate")}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Location & Experience */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {(mentor.location || mentor.mentor_location) && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{mentor.location || mentor.mentor_location}</span>
                    </div>
                  )}
                  {(mentor.experience_years || mentor.mentor_experience_years) && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {t("mentors.years", { years: String(mentor.experience_years || mentor.mentor_experience_years) })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hourly Rate */}
                {(mentor.hourly_rate ?? mentor.mentor_hourly_rate) !== undefined && (
                  <div className="flex items-center space-x-1 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">
                      {(mentor.hourly_rate ?? mentor.mentor_hourly_rate) === 0
                        ? t("mentors.free")
                        : t("mentors.per_hour", { rate: String(mentor.hourly_rate ?? mentor.mentor_hourly_rate) })}
                    </span>
                  </div>
                )}

                {/* Common Skills */}
                {mentor.common_skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{t("mentors.skills_match")}</p>
                    <div className="flex flex-wrap gap-1">
                      {mentor.common_skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={`${skill}-${index}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {mentor.common_skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          {t("mentors.more", { count: String(mentor.common_skills.length - 3) })}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Match Reasons */}
                {mentor.match_reasons.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium">{t("mentors.why_match")}</p>
                      {translatedReasonsByMentorId[mentor.id]?.length ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                          onClick={() =>
                            setShowOriginalReasonsByMentorId((prev) => ({
                              ...prev,
                              [mentor.id]: !prev[mentor.id],
                            }))
                          }
                        >
                          {showOriginalReasonsByMentorId[mentor.id]
                            ? t("common.see_translation")
                            : t("common.show_original")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                          onClick={() => translateMentorReasons(mentor.id, mentor.match_reasons)}
                          disabled={!!isTranslatingReasonsByMentorId[mentor.id]}
                        >
                          {isTranslatingReasonsByMentorId[mentor.id] ? t("chat.translating") : t("chat.translate")}
                        </button>
                      )}
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {((translatedReasonsByMentorId[mentor.id] && translatedReasonsByMentorId[mentor.id].length > 0 && !showOriginalReasonsByMentorId[mentor.id])
                        ? translatedReasonsByMentorId[mentor.id]
                        : mentor.match_reasons)
                        .slice(0, 3)
                        .map((reason, index) => (
                        <li key={`${String(reason)}-${index}`} className="flex items-start space-x-1">
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
                      <span>{t("mentors.score.skills")}</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.skills_match,
                        )}
                      >
                        {mentor.recommendation_score.skills_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("mentors.score.location")}</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.location_match,
                        )}
                      >
                        {mentor.recommendation_score.location_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("mentors.score.language")}</span>
                      <span
                        className={getScoreColor(
                          mentor.recommendation_score.language_match,
                        )}
                      >
                        {mentor.recommendation_score.language_match.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("mentors.score.experience")}</span>
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
                    onClick={() => router.push(`/chat/${mentor.id}`)}
                    className="flex-1"
                    size="sm"
                  >
                    {t("mentors.message")}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedMentor({ id: mentor.id, name: mentor.full_name });
                      setIsBookingOpen(true);
                    }}
                    className="flex-1"
                    size="sm"
                    variant="outline"
                  >
                    {t("mentors.book_session")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {viewMode === "recommended" && !isLoading && !error && recommendations.length === 0 && (
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
            onClick={(e) => e.stopPropagation()}
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
