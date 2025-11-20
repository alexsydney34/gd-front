"use client";

import { useState, useCallback } from "react";
import { ToastType } from "../components/Toast";

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
  };
}

