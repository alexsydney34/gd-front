// Development token helper
// This file should be used ONLY for development/testing

// Read from environment variables or use empty string
export const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN || "";

// Set to true to use DEV_TOKEN automatically (controlled by .env)
export const USE_DEV_TOKEN = process.env.NEXT_PUBLIC_USE_DEV_TOKEN === 'true';

// Helper to set token in localStorage
export function setDevToken() {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", DEV_TOKEN);
    console.log("✅ Dev token set successfully!");
  }
}

// Helper to clear token
export function clearDevToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    console.log("🗑️ Token cleared!");
  }
}

