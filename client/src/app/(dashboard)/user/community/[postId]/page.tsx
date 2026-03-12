"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageCircle } from "lucide-react";
import UserDashboardButton from "@/components/UserDashboardButton";
import { useI18n } from "@/context/I18nContext";

type PostDetails = {
  id: number;
  title: string;
  content: string;
  tags?: string;
  author_id: number;
  likes_count: number;
  created_at: string;
  liked?: boolean;
  author?: {
    id: number;
    full_name: string;
  };
  comments?: Array<{
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user?: {
      id: number;
      full_name: string;
    };
  }>;
};

function initials(name?: string) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + second).toUpperCase();
}

export default function CommunityPostDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { t, language } = useI18n();

  const isMentor = user?.role === "mentor";

  const postId = useMemo(() => {
    const raw = (params as any)?.postId;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const API_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    []
  );

  const [post, setPost] = useState<PostDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [liking, setLiking] = useState(false);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const [translatedPostContent, setTranslatedPostContent] = useState<string | null>(null);
  const [isPostTranslating, setIsPostTranslating] = useState(false);
  const [showOriginalPost, setShowOriginalPost] = useState(false);

  const [translatedCommentById, setTranslatedCommentById] = useState<Record<number, string>>({});
  const [isCommentTranslatingById, setIsCommentTranslatingById] = useState<Record<number, boolean>>({});
  const [showOriginalCommentById, setShowOriginalCommentById] = useState<Record<number, boolean>>({});

  const commentsCount = (post?.comments || []).length;

  const fetchDetails = async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `Failed to load post (${res.status})`);
      setPost(data);
      setTranslatedPostContent(null);
      setShowOriginalPost(false);
      setTranslatedCommentById({});
      setShowOriginalCommentById({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const translateText = async (text: string) => {
    const clean = String(text || "").trim();
    if (!clean) return "";
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error(t("common.login"));
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
    if (!res.ok) throw new Error(data?.detail || `Failed to translate (${res.status})`);
    const translated = String(data?.translated_text || "").trim();
    if (!translated) throw new Error("Failed to translate");
    return translated;
  };

  const handleTranslatePost = async () => {
    if (!post) return;
    setIsPostTranslating(true);
    try {
      const translated = await translateText(post.content);
      setTranslatedPostContent(translated);
      setShowOriginalPost(false);
    } catch (e) {
      setTranslatedPostContent(e instanceof Error ? e.message : "Failed to translate");
      setShowOriginalPost(false);
    } finally {
      setIsPostTranslating(false);
    }
  };

  const handleTranslateComment = async (commentId: number, content: string) => {
    setIsCommentTranslatingById((prev) => ({ ...prev, [commentId]: true }));
    try {
      const translated = await translateText(content);
      setTranslatedCommentById((prev) => ({ ...prev, [commentId]: translated }));
      setShowOriginalCommentById((prev) => ({ ...prev, [commentId]: false }));
    } catch (e) {
      setTranslatedCommentById((prev) => ({
        ...prev,
        [commentId]: e instanceof Error ? e.message : "Failed to translate",
      }));
      setShowOriginalCommentById((prev) => ({ ...prev, [commentId]: false }));
    } finally {
      setIsCommentTranslatingById((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  useEffect(() => {
    if (!isMentor) fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, isMentor]);

  const handleLike = async () => {
    if (!postId) return;
    setLiking(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `Failed to like post (${res.status})`);

      setPost((p) =>
        p
          ? {
              ...p,
              likes_count: data.likes_count ?? p.likes_count,
              liked: true,
            }
          : p
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to like post");
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!postId) return;
    const content = comment.trim();
    if (!content) return;

    setCommenting(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `Failed to comment (${res.status})`);

      setPost((p) => (p ? { ...p, comments: [...(p.comments || []), data] } : p));
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to comment");
    } finally {
      setCommenting(false);
    }
  };

  if (isMentor) {
    return (
      <PageWrapper>
        <main className="max-w-3xl mx-auto px-6 py-8">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" role="main">
        <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserDashboardButton />
              <Link href="/user/community" className="text-sm text-muted-foreground hover:underline">
                {t("community.back_to_feed")}
              </Link>
            </div>
            <Button
              variant="outline"
              className="rounded-xl w-full sm:w-auto"
              onClick={() => router.push("/user/community/create")}
            >
              {t("community.new_post")}
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : post ? (
          <>
            <Card className="border shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                    {initials(post.author?.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl leading-snug">{post.title}</CardTitle>
                    <CardDescription>
                      {post.author?.full_name ? post.author.full_name : `User #${post.author_id}`}
                      {post.created_at ? ` • ${new Date(post.created_at).toLocaleString()}` : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {translatedPostContent && !showOriginalPost ? translatedPostContent : post.content}
                </p>

                <div>
                  {translatedPostContent ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                      onClick={() => setShowOriginalPost((v) => !v)}
                    >
                      {showOriginalPost ? t("common.see_translation") : t("common.show_original")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                      onClick={handleTranslatePost}
                      disabled={isPostTranslating}
                    >
                      {isPostTranslating ? t("chat.translating") : t("chat.translate")}
                    </button>
                  )}
                </div>

                {post.tags ? <p className="text-xs text-muted-foreground">{t("community.tags")}: {post.tags}</p> : null}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                      onClick={handleLike}
                      disabled={liking || post.liked}
                    >
                      <Heart className={`h-4 w-4 ${post.liked ? "text-red-500" : ""}`} />
                      <span className="hidden sm:inline">{post.liked ? t("community.liked") : t("community.like")}</span>
                      <span>({post.likes_count ?? 0})</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                      onClick={() => setIsCommentsOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("community.comment")}</span>
                      <span>({commentsCount})</span>
                    </button>
                  </div>

                  {post.author_id ? (
                    <Link href={`/chat/${post.author_id}`}>
                      <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                        {t("community.chat_with_author")}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {isCommentsOpen ? (
              <div className="fixed inset-0 z-50">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label={t("community.close_comments")}
                  onClick={() => setIsCommentsOpen(false)}
                />

                <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
                  <div className="w-full sm:max-w-2xl sm:w-[640px]">
                    <Card className="border shadow-lg rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">{t("community.comments")}</CardTitle>
                            <CardDescription>{t("community.comments_subtitle")}</CardDescription>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setIsCommentsOpen(false)}
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6 space-y-4 overflow-auto">
                        {(post.comments || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t("community.no_comments")}</p>
                        ) : (
                          <div className="space-y-3">
                            {(post.comments || []).map((c) => (
                              <div key={c.id} className="p-4 rounded-xl border bg-card">
                                <div className="flex items-start gap-3">
                                  <div className="h-9 w-9 rounded-full border bg-muted flex items-center justify-center text-[11px] font-semibold text-foreground">
                                    {initials(c.user?.full_name)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground">
                                      {c.user?.full_name ? c.user.full_name : `User #${c.user_id}`}
                                      {c.created_at ? ` • ${new Date(c.created_at).toLocaleString()}` : ""}
                                    </p>
                                    <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                                      {translatedCommentById[c.id] && !showOriginalCommentById[c.id]
                                        ? translatedCommentById[c.id]
                                        : c.content}
                                    </p>

                                    <div className="pt-1">
                                      {translatedCommentById[c.id] ? (
                                        <button
                                          type="button"
                                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                                          onClick={() =>
                                            setShowOriginalCommentById((prev) => ({
                                              ...prev,
                                              [c.id]: !prev[c.id],
                                            }))
                                          }
                                        >
                                          {showOriginalCommentById[c.id]
                                            ? t("common.see_translation")
                                            : t("common.show_original")}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                                          onClick={() => handleTranslateComment(c.id, c.content)}
                                          disabled={!!isCommentTranslatingById[c.id]}
                                        >
                                          {isCommentTranslatingById[c.id] ? t("chat.translating") : t("chat.translate")}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("community.write_comment")}
                            className="min-h-[100px]"
                          />
                          <div className="flex items-center justify-end">
                            <Button className="rounded-xl" onClick={handleComment} disabled={commenting || !comment.trim()}>
                              {commenting ? t("community.posting") : t("community.post_comment")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{t("community.post_not_found")}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </PageWrapper>
  );
}
