"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "../lib/api";
import { useAuth } from "./AuthContext";

type Language = "ru" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function LanguageProviderInner({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchLanguage = async () => {
      // Ждем окончания авторизации
      if (isAuthLoading) {
        return;
      }

      try {
        // Always fetch from API (API has priority)
        const response = await apiClient.getWallet(1, 0);
        if (response.data?.lang) {
          const apiLang = response.data.lang.toLowerCase();
          const lang: Language = apiLang === "en" ? "en" : "ru";
          setLanguageState(lang);
          localStorage.setItem("app_language", lang);
        } else {
          // Fallback to localStorage if API doesn't return lang
          const savedLang = localStorage.getItem("app_language") as Language | null;
          if (savedLang && (savedLang === "ru" || savedLang === "en")) {
            setLanguageState(savedLang);
          } else {
            setLanguageState("ru");
          }
        }
      } catch (error) {
        console.error("Failed to fetch language:", error);
        // Fallback to localStorage on error
        const savedLang = localStorage.getItem("app_language") as Language | null;
        if (savedLang && (savedLang === "ru" || savedLang === "en")) {
          setLanguageState(savedLang);
        } else {
          setLanguageState("ru");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguage();
  }, [isAuthLoading, isAuthenticated]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Wrapper to avoid circular dependency with AuthContext
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageProviderInner>{children}</LanguageProviderInner>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

