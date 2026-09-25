import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest, getMe } from "../services/api";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const token = localStorage.getItem("tailoring_token") ?? sessionStorage.getItem("tailoring_token");
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      try {
        const result = await getMe();
        if (active) setUser(result.data);
      } catch {
        localStorage.removeItem("tailoring_token");
        sessionStorage.removeItem("tailoring_token");
      } finally {
        if (active) setLoading(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function login(username: string, password: string, rememberMe: boolean) {
    const result = await loginRequest(username, password, rememberMe);
    localStorage.removeItem("tailoring_token");
    sessionStorage.removeItem("tailoring_token");
    (rememberMe ? localStorage : sessionStorage).setItem("tailoring_token", result.data.token);
    setUser(result.data.user);
  }

  function logout() {
    localStorage.removeItem("tailoring_token");
    sessionStorage.removeItem("tailoring_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
