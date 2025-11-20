"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/api";
import { useTelegram } from "../hooks/useTelegram";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const { webApp, isReady } = useTelegram();

  const login = useCallback(async (): Promise<boolean> => {
    if (!webApp?.initData) {
      console.error("No initData available");
      return false;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.login(webApp.initData);
      
      if (response.data?.token) {
        setToken(response.data.token);
        setIsAuthenticated(true);
        
        // Проверяем show_subs из ответа API
        // show_subs: false означает что подписка НЕ прошла, нужно показать модал
        if (typeof window !== "undefined") {
          const showSubs = response.data.show_subs;
          
          // Если show_subs === false, значит нужно показать подписку
          if (showSubs === false) {
            localStorage.setItem("needsSubscribe", "true");
          } else {
            // Если подписка прошла, удаляем флаг
            localStorage.removeItem("needsSubscribe");
          }
        }
        
        return true;
      } else {
        console.error("Login failed:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [webApp]);

  const logout = () => {
    apiClient.clearToken();
    setToken(null);
    setIsAuthenticated(false);
  };

  // Автоматическая авторизация при загрузке
  useEffect(() => {
    const autoLogin = async () => {
      // Всегда делаем логин при запуске приложения для получения актуальных данных
      if (isReady && webApp?.initData) {
        await login();
      } else {
        // Если Telegram еще не готов, проверяем сохраненный токен
        const savedToken = apiClient.getToken();
        if (savedToken) {
          setToken(savedToken);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      }
    };

    autoLogin();
  }, [isReady, webApp]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

