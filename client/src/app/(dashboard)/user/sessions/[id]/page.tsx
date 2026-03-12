"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/context/AuthContext";
import UserDashboardButton from "@/components/UserDashboardButton";
import { useI18n } from "@/context/I18nContext";

type Session = {
  id: number;
  mentor_id: number;
  learner_id: number;
  scheduled_time: string;
  status: string;
  meeting_link?: string | null;
  notes?: string | null;
  is_completed?: boolean;
};

type PublicUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export default function UserSessionWorkspacePage() {
  const params = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const isMentor = user?.role === "mentor";

  const sessionId = useMemo(() => {
    const raw = (params as any)?.id;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mentorUser, setMentorUser] = useState<PublicUser | null>(null);
  const [learnerUser, setLearnerUser] = useState<PublicUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("auth_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.detail || "Failed to load session");
        }

        setSession(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    const fetchNames = async () => {
      if (!session) return;
      try {
        const token = localStorage.getItem("auth_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const [mentorRes, learnerRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${session.mentor_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/users/${session.learner_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const mentorData = await mentorRes.json().catch(() => null);
        const learnerData = await learnerRes.json().catch(() => null);

        if (mentorRes.ok && mentorData) setMentorUser(mentorData);
        if (learnerRes.ok && learnerData) setLearnerUser(learnerData);
      } catch {
        // ignore name lookup errors
      }
    };

    fetchNames();
  }, [session]);

  const recipientId = useMemo(() => {
    if (!session || !user) return null;
    return isMentor ? session.learner_id : session.mentor_id;
  }, [isMentor, session, user]);

  const recipientName = useMemo(() => {
    if (!session || !user) return null;
    if (isMentor) return learnerUser?.full_name || `User #${session.learner_id}`;
    return mentorUser?.full_name || `User #${session.mentor_id}`;
  }, [isMentor, learnerUser?.full_name, mentorUser?.full_name, session, user]);

  const isAccepted = useMemo(() => {
    return String(session?.status || "").toLowerCase() === "accepted";
  }, [session?.status]);

  return (
    <PageWrapper>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6" role="main">
        <div className="sticky top-0 z-40 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <UserDashboardButton />
          </div>
        </div>

        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{t("sessions.workspace")}</CardTitle>
                <CardDescription>
                  {sessionId ? t("sessions.session_number", { id: String(sessionId) }) : t("sessions.session")}
                </CardDescription>
              </div>
              {session?.status && (
                <Badge variant="secondary" className="shrink-0">
                  {String(session.status).toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : session ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground">{t("sessions.mentor")}</p>
                  <p className="text-sm font-medium text-foreground">
                    {mentorUser?.full_name || `User #${session.mentor_id}`}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground">{t("sessions.learner")}</p>
                  <p className="text-sm font-medium text-foreground">
                    {learnerUser?.full_name || `User #${session.learner_id}`}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground">{t("sessions.scheduled")}</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(session.scheduled_time).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground">{t("sessions.completed")}</p>
                  <p className="text-sm font-medium text-foreground">
                    {session.is_completed ? t("common.yes") : t("common.no")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("sessions.not_found")}</p>
            )}

            {session?.meeting_link ? (
              <a href={session.meeting_link} target="_blank" rel="noreferrer">
                <Button className="rounded-xl">{t("sessions.join")}</Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("sessions.meeting_link_pending")}
              </p>
            )}

            {isAccepted && recipientId && session ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={isChatOpen ? "outline" : "default"}
                  className="rounded-xl"
                  onClick={() => setIsChatOpen((v) => !v)}
                >
                  {isChatOpen ? t("common.cancel") : t("sessions.message")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isAccepted && isChatOpen && recipientId && session ? (
          <ChatInterface
            recipientId={recipientId}
            recipientName={recipientName || `User #${recipientId}`}
          />
        ) : (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("sessions.chat_pending")}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </PageWrapper>
  );
}
