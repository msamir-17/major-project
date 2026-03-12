"use client";

import React, { useMemo, useState, useEffect } from "react"; 
import Logo from "@/components/Logo";
import PageWrapper from "@/components/PageWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageCircle,
  Calendar,
  BookOpen,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMentorRecommendations } from "@/hooks/useRecommendation";
import TranslateButton from "@/components/TranslateButton";
import { useI18n } from "@/context/I18nContext";

const UserDashboard: React.FC = () => {
  const [sessions, setSessions] = useState([]);
  // To hold the sessions
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSession, setWorkspaceSession] = useState<any | null>(null);
  const [userCache, setUserCache] = useState<Record<number, any>>({});

  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  const {
    recommendations,
    isLoading: isRecommendationsLoading,
    error: recommendationsError,
    fetchRecommendations,
  } = useMentorRecommendations();

  const sortedSessions = useMemo(() => {
    const copy = Array.isArray(sessions) ? [...sessions] : [];
    copy.sort((a: any, b: any) => {
      const at = new Date(a?.scheduled_time || 0).getTime();
      const bt = new Date(b?.scheduled_time || 0).getTime();
      return bt - at;
    });
    return copy;
  }, [sessions]);

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem("auth_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${API_URL}/api/sessions/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchRecommendations(3);
  }, [fetchRecommendations]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsCommunityLoading(true);
      setCommunityError(null);
      try {
        const token = localStorage.getItem("auth_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/community/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || `Failed to load posts (${res.status})`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCommunityPosts(list.slice(0, 3));
      } catch (e) {
        setCommunityError(e instanceof Error ? e.message : "Failed to load posts");
        setCommunityPosts([]);
      } finally {
        setIsCommunityLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useAuth();

  const { t } = useI18n();

  const isMentor = user?.role === "mentor";

  useEffect(() => {
    const fetchUser = async (id: number) => {
      if (!id || userCache[id]) return;

      try {
        const token = localStorage.getItem("auth_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          setUserCache((prev) => ({ ...prev, [id]: data }));
        }
      } catch {
        // ignore lookup errors
      }
    };

    if (!isWorkspaceOpen || !workspaceSession) return;

    const mentorId = Number(workspaceSession?.mentor_id);
    const learnerId = Number(workspaceSession?.learner_id);

    if (Number.isFinite(mentorId) && mentorId > 0) fetchUser(mentorId);
    if (Number.isFinite(learnerId) && learnerId > 0) fetchUser(learnerId);
  }, [isWorkspaceOpen, workspaceSession, userCache]);

  const getDisplayName = (id: any) => {
    const num = Number(id);
    const cached = Number.isFinite(num) ? userCache[num] : null;
    return cached?.full_name || `User #${String(id ?? "-")}`;
  };

  return (
    <PageWrapper>
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="h-6 w-px bg-border/50"></div>
            <Badge variant="secondary" className="text-primary" aria-label="User role">
              {t("user.learner")}
            </Badge>
          </div>

          <nav className="flex items-center gap-3" role="navigation" aria-label="User navigation">
            <TranslateButton variant="ghost" size="sm" className="rounded-xl" />
            <Button variant="ghost" size="sm" className="rounded-xl">
              <User className="h-4 w-4 mr-2" />
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.logout")}
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6" role="main">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{t("nav.dashboard")}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {t("user.dashboard_subtitle")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl hidden sm:inline-flex"
            onClick={() => router.push("/agent")}
          >
            {t("nav.ask_ai")}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button
            onClick={() => router.push("/agent")}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border bg-card hover:bg-muted/20"
          >
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">{t("nav.agent")}</span>
          </Button>

          <Button
            onClick={() => router.push("/user/recommendations")}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border bg-card hover:bg-muted/20"
          >
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">{t("nav.find_mentors")}</span>
          </Button>

          <Button
            onClick={() => router.push("/chat/2")}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border bg-card hover:bg-muted/20"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{t("nav.messages")}</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border bg-card hover:bg-muted/20"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">{t("nav.schedule")}</span>
          </Button>

          <Button
            onClick={() => router.push("/user/community")}
            variant="outline"
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-xl border bg-card hover:bg-muted/20"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">{t("nav.community")}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{t("sessions.upcoming")}</CardTitle>
                    <CardDescription>{t("sessions.upcoming_subtitle")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    {t("sessions.history")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {sessions.length > 0 ? (
                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
                    {sessions.map((session: any, index: number) => {
                        const status = String(session.status ?? "").toLowerCase();
                        const isCompleted = Boolean(session.is_completed);
                        const canOpenWorkspace = status === "accepted" || status === "confirmed" || isCompleted;
                        const isBlockedWorkspace = status === "pending" || status === "cancelled" || status === "expired";
                        const statusLabel =
                          status === "pending"
                            ? t("sessions.status.pending")
                            : status === "accepted"
                              ? t("sessions.status.accepted")
                              : status === "rejected"
                                ? t("sessions.status.rejected")
                                : status === "expired"
                                  ? t("sessions.status.expired")
                                : session.status;

                        const statusVariant =
                          status === "accepted"
                            ? "default"
                            : status === "rejected"
                              ? "destructive"
                              : status === "expired"
                                ? "secondary"
                              : "secondary";

                        return (
                          <div
                            key={session.id ?? index}
                            className={`p-4 rounded-xl border bg-card ${canOpenWorkspace ? "cursor-pointer" : "cursor-default"} ${status === "expired" ? "opacity-60" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (!canOpenWorkspace || isBlockedWorkspace) return;
                              setWorkspaceSession(session);
                              setIsWorkspaceOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (!canOpenWorkspace || isBlockedWorkspace) return;
                              if ((e.key === "Enter" || e.key === " ") && session?.id != null) {
                                e.preventDefault();
                                setWorkspaceSession(session);
                                setIsWorkspaceOpen(true);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {t("sessions.request_title", { id: String(session.id ?? "-") })}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {status === "pending"
                                    ? t("sessions.request_pending")
                                    : status === "accepted"
                                      ? t("sessions.request_accepted")
                                      : status === "rejected"
                                        ? t("sessions.request_rejected")
                                        : t("sessions.request_status", { status: String(session.status ?? "") })}
                                </p>
                              </div>
                              <Badge variant={statusVariant as any} className="shrink-0">
                                {statusLabel}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
                              <span className="text-xs text-muted-foreground">
                                {new Date(session.scheduled_time).toLocaleDateString()}
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {new Date(session.scheduled_time).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("sessions.empty")}
                  </div>
                )}
              </CardContent>
            </Card>

            {isHistoryOpen ? (
              <div className="fixed inset-0 z-50">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Close session history"
                  onClick={() => setIsHistoryOpen(false)}
                />

                <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                  <div className="w-full sm:max-w-3xl sm:w-[720px]">
                    <Card className="border shadow-lg rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">Session History</CardTitle>
                            <CardDescription>All your session requests (latest first)</CardDescription>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setIsHistoryOpen(false)}
                          >
                            Close
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-4">
                        {sortedSessions.length > 0 ? (
                          sortedSessions.map((session: any, index: number) => {
                            const status = String(session.status ?? "").toLowerCase();
                            const statusLabel =
                              status === "pending"
                                ? "Pending"
                                : status === "accepted"
                                  ? "Accepted"
                                  : status === "rejected"
                                    ? "Rejected"
                                    : session.status;

                            const statusVariant =
                              status === "accepted"
                                ? "default"
                                : status === "rejected"
                                  ? "destructive"
                                  : "secondary";

                            return (
                              <div
                                key={session.id ?? index}
                                className="p-4 rounded-xl border bg-card cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (session?.id != null) {
                                    setIsHistoryOpen(false);
                                    router.push(`/user/sessions/${session.id}`);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if ((e.key === "Enter" || e.key === " ") && session?.id != null) {
                                    e.preventDefault();
                                    setIsHistoryOpen(false);
                                    router.push(`/user/sessions/${session.id}`);
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-semibold text-sm text-foreground">
                                      {`Session request (#${session.id ?? "-"})`}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(session.scheduled_time).toLocaleString()}
                                    </p>
                                  </div>
                                  <Badge variant={statusVariant as any} className="shrink-0">
                                    {statusLabel}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                            No sessions found.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null}

            {isWorkspaceOpen && workspaceSession ? (
              <div className="fixed inset-0 z-50">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label={t("sessions.workspace_close")}
                  onClick={() => {
                    setIsWorkspaceOpen(false);
                    setWorkspaceSession(null);
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                  <div className="w-full sm:max-w-3xl sm:w-[760px]">
                    <Card className="border shadow-lg rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">{t("sessions.workspace")}</CardTitle>
                            <CardDescription>
                              {t("sessions.session_number", { id: String(workspaceSession.id ?? "-") })}
                            </CardDescription>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setIsWorkspaceOpen(false);
                              setWorkspaceSession(null);
                            }}
                          >
                            {t("common.close")}
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 rounded-xl border bg-card">
                            <p className="text-xs text-muted-foreground">{t("sessions.modal.session_id")}</p>
                            <p className="text-sm font-medium">{String(workspaceSession.id ?? "-")}</p>
                          </div>
                          <div className="p-4 rounded-xl border bg-card">
                            <p className="text-xs text-muted-foreground">{t("sessions.modal.status")}</p>
                            <p className="text-sm font-medium">{String(workspaceSession.status ?? "").toUpperCase()}</p>
                          </div>
                          <div className="p-4 rounded-xl border bg-card">
                            <p className="text-xs text-muted-foreground">{t("sessions.mentor")}</p>
                            <p className="text-sm font-medium">{getDisplayName(workspaceSession.mentor_id)}</p>
                          </div>
                          <div className="p-4 rounded-xl border bg-card">
                            <p className="text-xs text-muted-foreground">{t("sessions.learner")}</p>
                            <p className="text-sm font-medium">{getDisplayName(workspaceSession.learner_id)}</p>
                          </div>
                          <div className="p-4 rounded-xl border bg-card sm:col-span-2">
                            <p className="text-xs text-muted-foreground">{t("sessions.scheduled")}</p>
                            <p className="text-sm font-medium">
                              {workspaceSession.scheduled_time
                                ? new Date(workspaceSession.scheduled_time).toLocaleString()
                                : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button type="button" className="rounded-xl" disabled>
                            {t("sessions.modal.join_meeting")}
                          </Button>
                        </div>

                        <div className="border rounded-xl p-4 bg-card space-y-3">
                          <p className="text-sm font-semibold">{t("sessions.modal.session_chat")}</p>
                          <div className="h-28 rounded-lg border bg-muted/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{t("mentors.recommended")}</CardTitle>
                    <CardDescription>{t("mentors.recommended_subtitle")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.push("/user/recommendations")}
                  >
                    {t("common.see_all")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isMentor ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("mentors.recommended_learner_only")}
                  </div>
                ) : recommendationsError ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {recommendationsError}
                  </div>
                ) : isRecommendationsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("common.loading")}
                  </div>
                ) : (recommendations || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("mentors.recommended_empty")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(recommendations || []).slice(0, 3).map((m: any) => {
                      const skillsRaw = m?.skills || m?.mentor_skills || "";
                      const skills = String(skillsRaw)
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3);

                      const hourlyRate = m?.hourly_rate ?? m?.mentor_hourly_rate;
                      const headline = [m?.job_title || m?.mentor_job_title, m?.company || m?.mentor_company]
                        .filter(Boolean)
                        .join(" at ");

                      return (
                        <button
                          key={m?.id}
                          type="button"
                          className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors"
                          onClick={() => router.push("/user/recommendations")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{m?.full_name}</p>
                              {headline ? (
                                <p className="text-xs text-muted-foreground mt-1">{headline}</p>
                              ) : null}
                              {skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {skills.map((s: string) => (
                                    <Badge key={s} variant="secondary" className="text-xs">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            {hourlyRate != null ? (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                ${hourlyRate}/hr
                              </Badge>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{t("nav.community")}</CardTitle>
                    <CardDescription>{t("community.latest_posts")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => router.push("/user/community/create")}
                    >
                      {t("community.create")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => router.push("/user/community")}
                    >
                      {t("community.open")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isMentor ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("community.learner_only")}
                  </div>
                ) : communityError ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {communityError}
                  </div>
                ) : isCommunityLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("common.loading")}
                  </div>
                ) : communityPosts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 rounded-xl bg-muted/20 border">
                    {t("community.empty")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communityPosts.map((p: any) => (
                      <button
                        key={p?.id}
                        type="button"
                        className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors"
                        onClick={() => router.push(`/user/community/${p.id}`)}
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-1">{p?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p?.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
};

export default UserDashboard;
