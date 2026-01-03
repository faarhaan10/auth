"use client";

import React, { useEffect } from "react";

type User = { id: string; email: string; role?: string; name?: string };

type AuthContextType = { 
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if(token) return
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("http://localhost:5050/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = res.ok ? await res.json() : null;
        if (!cancelled) setToken(data?.data?.accessToken ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);


  const logout = async () => {
    try {
      await fetch("http://localhost:5050/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally { 
      setToken(null);
    }
  };

  const value = React.useMemo(
    () => ({ loading, token, setToken, logout, isLoggedIn: !!token }),
    [token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
