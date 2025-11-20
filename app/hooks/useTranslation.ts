"use client";

import { useMemo } from "react";
import { ru } from "../locales/ru";
import { en } from "../locales/en";
import { useLanguage } from "../contexts/LanguageContext";

type Translations = typeof ru;

export function useTranslation() {
  const { language, isLoading } = useLanguage();
  
  const translations: Translations = useMemo(() => {
    // Если язык английский - используем английский
    if (language === "en") {
      return en;
    }
    
    // По умолчанию русский
    return ru;
  }, [language]);

  return { t: translations, language, isLoading };
}

