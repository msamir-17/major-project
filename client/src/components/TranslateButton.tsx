"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import LanguageSelectorModal from "@/components/LanguageSelectorModal";
import { useI18n } from "@/context/I18nContext";

type Props = {
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default";
  className?: string;
};

export default function TranslateButton({ variant = "ghost", size = "sm", className }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        aria-label={t("common.translate")}
      >
        <span className="mr-2" aria-hidden>
          🌐
        </span>
        {t("common.translate")}
      </Button>

      <LanguageSelectorModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
