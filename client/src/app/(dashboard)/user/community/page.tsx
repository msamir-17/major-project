"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageCircle } from "lucide-react";
import UserDashboardButton from "@/components/UserDashboardButton";
import { useI18n } from "@/context/I18nContext";

type CommunityPost = {
  id: number;
  title: string;
  content: string;
  tags?: string;
  author_id: number;
  likes_count: number;
  created_at: string;
  author?: {
    id: number;
    full_name: string;
  };
};

function initials(name?: string) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + second).toUpperCase();
}

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [translatedContentByPostId, setTranslatedContentByPostId] = useState<Record<number, string>>({});
  const [isTranslatingByPostId, setIsTranslatingByPostId] = useState<Record<number, boolean>>({});
  const [showOriginalByPostId, setShowOriginalByPostId] = useState<Record<number, boolean>>({});

  const isMentor = user?.role === "mentor";

  const API_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    []
  );

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_URL}/api/community/posts`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.detail || `Failed to load posts (${res.status})`);
        }

        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    if (!isMentor) fetchPosts();
  }, [API_URL, isMentor]);

  const translatePostContent = async (postId: number, content: string) => {
    const clean = String(content || "").trim();
    if (!clean) return;

    setIsTranslatingByPostId((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error(t("common.login"));
      }

      const targetLanguage = language === "hi" ? "Hindi" : language === "es" ? "Spanish" : "English";
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

      setTranslatedContentByPostId((prev) => ({ ...prev, [postId]: translated }));
      setShowOriginalByPostId((prev) => ({ ...prev, [postId]: false }));
    } catch (e) {
      setTranslatedContentByPostId((prev) => ({
        ...prev,
        [postId]: e instanceof Error ? e.message : "Failed to translate",
      }));
    } finally {
      setIsTranslatingByPostId((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (isMentor) {
    return (
      <PageWrapper>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Card className="border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl">{t("nav.community")}</CardTitle>
              <CardDescription>{t("community.learner_only")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">403 Forbidden</p>
            </CardContent>
          </Card>
        </main>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" role="main">
        <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <UserDashboardButton />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("community.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("community.subtitle")}</p>
          </div>
          <Link href="/user/community/create">
            <Button className="rounded-xl">{t("community.create_post")}</Button>
          </Link>
        </div>

        {loading ? (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("community.loading_posts")}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("community.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/user/community/${post.id}`} className="block">
                <Card className="border shadow-sm rounded-xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full border bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                        {initials(post.author?.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {post.author?.full_name ? post.author.full_name : `User #${post.author_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                        {translatedContentByPostId[post.id] && !showOriginalByPostId[post.id]
                          ? translatedContentByPostId[post.id]
                          : post.content}
                      </p>

                      <div className="pt-1">
                        {translatedContentByPostId[post.id] ? (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowOriginalByPostId((prev) => ({
                                ...prev,
                                [post.id]: !prev[post.id],
                              }));
                            }}
                          >
                            {showOriginalByPostId[post.id]
                              ? t("common.see_translation")
                              : t("common.show_original")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              translatePostContent(post.id, post.content);
                            }}
                            disabled={!!isTranslatingByPostId[post.id]}
                          >
                            {isTranslatingByPostId[post.id] ? t("chat.translating") : t("chat.translate")}
                          </button>
                        )}
                      </div>
                    </div>

                    {post.tags ? (
                      <p className="text-xs text-muted-foreground line-clamp-1">{t("community.tags")}: {post.tags}</p>
                    ) : null}

                    <div className="flex items-center gap-6 pt-2 border-t text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("community.comments")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PageWrapper>
  );
}
