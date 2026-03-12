"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LanguageSelectorModal({ open, onClose }: Props) {
  const { language, setLanguage, t } = useI18n();

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
        <div className="w-full sm:max-w-sm">
          <Card className="border shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{t("common.select_language")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                type="button"
                variant={language === "en" ? "default" : "outline"}
                className="w-full justify-start rounded-xl"
                onClick={() => {
                  setLanguage("en");
                  onClose();
                }}
              >
                {t("common.english")}
              </Button>
              <Button
                type="button"
                variant={language === "hi" ? "default" : "outline"}
                className="w-full justify-start rounded-xl"
                onClick={() => {
                  setLanguage("hi");
                  onClose();
                }}
              >
                {t("common.hindi")}
              </Button>
              <Button
                type="button"
                variant={language === "es" ? "default" : "outline"}
                className="w-full justify-start rounded-xl"
                onClick={() => {
                  setLanguage("es");
                  onClose();
                }}
              >
                {t("common.spanish")}
              </Button>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl"
                  onClick={onClose}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
