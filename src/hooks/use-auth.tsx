"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserRole } from "@/lib/auth";

interface AuthState {
  userId: number | null;
  name: string;
  role: UserRole;
  fingerprint: string | null;
  isWhitelisted: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    name: "",
    role: "visitor",
    fingerprint: null,
    isWhitelisted: false,
    isLoading: true,
  });
  const [isDevMode, setIsDevMode] = useState(false);

  // Load saved session + dev mode flag on mount
  useEffect(() => {
    const saved = localStorage.getItem("yugo-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...parsed, isLoading: false });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }

    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setIsDevMode(data.devMode))
      .catch(() => {});
  }, []);

  const login = useCallback(async (role: UserRole) => {
    // Get fingerprint
    let fingerprint: string | null = null;
    try {
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      fingerprint = result.visitorId;
    } catch {
      fingerprint = "fp_" + Math.random().toString(36).slice(2);
    }

    // Register with server
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, fingerprint }),
    });

    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();

    const newState: AuthState = {
      userId: data.userId,
      name: data.name,
      role: data.role,
      fingerprint,
      isWhitelisted: data.isWhitelisted,
      isLoading: false,
    };

    setState(newState);
    localStorage.setItem("yugo-auth", JSON.stringify(newState));
  }, []);

  // Dev-only: instant role switch without re-fingerprinting
  const switchRole = useCallback((role: UserRole) => {
    if (!isDevMode) return;

    // Map role to hardcoded user IDs from seed data
    const roleMap: Record<string, { userId: number; name: string }> = {
      hugo: { userId: 1, name: "Hugo" },
      yuge: { userId: 2, name: "Yuge" },
      visitor: { userId: 0, name: "Visitor" },
    };

    const info = roleMap[role] || roleMap.visitor;
    const newState: AuthState = {
      userId: info.userId,
      name: info.name,
      role: role as UserRole,
      fingerprint: state.fingerprint,
      isWhitelisted: role !== "visitor",
      isLoading: false,
    };

    setState(newState);
    localStorage.setItem("yugo-auth", JSON.stringify(newState));
  }, [state.fingerprint, isDevMode]);

  const logout = useCallback(() => {
    setState({
      userId: null,
      name: "",
      role: "visitor",
      fingerprint: null,
      isWhitelisted: false,
      isLoading: false,
    });
    localStorage.removeItem("yugo-auth");
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, switchRole, logout, isDevMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
