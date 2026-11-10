import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LegalApiService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("law_ai_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          name: parsed.name || parsed.full_name || parsed.email?.split("@")[0] || "Counsel",
          email: parsed.email || "",
          picture: parsed.picture || parsed.avatar || "",
        };
      }
    } catch (e) {
      console.warn("Failed to restore saved user:", e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      name: userData.name || userData.full_name || userData.email?.split("@")[0] || "Counsel",
      email: userData.email || "",
      picture: userData.picture || userData.avatar || "",
    };
  };

  const login = useCallback((userData, token = null) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    if (normalized) {
      try {
        localStorage.setItem("law_ai_user", JSON.stringify(normalized));
        if (token) {
          localStorage.setItem("law_ai_token", token);
        }
      } catch (e) {
        console.warn("Could not save auth to localStorage:", e);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await LegalApiService.logout();
    } catch (e) {
      console.warn("Backend logout notification failed:", e);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem("law_ai_user");
        localStorage.removeItem("law_ai_token");
      } catch (e) {
        console.warn("Could not clear auth localStorage:", e);
      }
    }
  }, []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Check URL params for OAuth redirect (?auth_success=true)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success") === "true") {
      LegalApiService.getMe()
        .then((userData) => {
          login(userData);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        })
        .catch((err) => {
          console.warn("Failed to fetch user following Google OAuth redirect:", err);
        });
    }
  }, [login]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
