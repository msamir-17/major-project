"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import UserDashboardButton from "@/components/UserDashboardButton";
import { useI18n } from "@/context/I18nContext";

export default function CommunityCreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isMentor = user?.role === "mentor";

  const API_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    []
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) return setError(t("community.form.title_required"));
    if (!trimmedContent) return setError(t("community.form.content_required"));

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          tags: tags.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || `Failed to create post (${res.status})`);
      }

      router.push("/user/community");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  if (isMentor) {
    return (
      <PageWrapper>
        <main className="max-w-3xl mx-auto px-6 py-8">
          <Card className="border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl">{t("community.create_post")}</CardTitle>
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8" role="main">
        <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border mb-6">
          <div className="flex items-center justify-between gap-3">
            <UserDashboardButton />
          </div>
        </div>

        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">{t("community.create_post_title")}</CardTitle>
            <CardDescription>{t("community.create_post_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("community.form.title")}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("community.form.title_placeholder")} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("community.form.content")}</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("community.form.content_placeholder")}
                  className="min-h-[160px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("community.form.tags")}</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("community.form.tags_placeholder")}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl w-full sm:w-auto"
                  onClick={() => router.push("/user/community")}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="rounded-xl w-full sm:w-auto" disabled={saving}>
                  {saving ? t("community.form.creating") : t("community.form.create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}
