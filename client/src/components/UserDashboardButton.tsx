"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

type UserDashboardButtonProps = {
  className?: string;
  label?: string;
};

export default function UserDashboardButton({
  className,
  label,
}: UserDashboardButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  const dashboardPath = user?.role === "mentor" ? "/mentor" : "/user";

  return (
    <Button
      variant="outline"
      onClick={() => router.push(dashboardPath)}
      className={`flex items-center gap-2 ${className || ""}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label ?? t("nav.dashboard")}
    </Button>
  );
}
