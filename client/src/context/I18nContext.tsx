"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type LanguageCode = "en" | "hi" | "es";

type Dictionary = Record<string, string>;

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "sb_lang";

async function loadDictionary(lang: LanguageCode): Promise<Dictionary> {
  switch (lang) {
    case "hi":
      return (await import("@/locales/hi.json")).default as Dictionary;
    case "es":
      return (await import("@/locales/es.json")).default as Dictionary;
    case "en":
    default:
      return (await import("@/locales/en.json")).default as Dictionary;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [dict, setDict] = useState<Dictionary>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored === "en" || stored === "hi" || stored === "es") {
        setLanguageState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDictionary(language)
      .then((d) => {
        if (!cancelled) setDict(d);
      })
      .catch(() => {
        if (!cancelled) setDict({});
      });

    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }

    return () => {
      cancelled = true;
    };
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const value = dict[key];
      const base = typeof value === "string" && value.length > 0 ? value : key;
      if (!vars) return base;

      return Object.keys(vars).reduce((acc, k) => {
        return acc.split(`{${k}}`).join(String(vars[k] ?? ""));
      }, base);
    },
    [dict]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
