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
    const token = localStorage.getItem("tailoring_token") ?? sessionStorage.getItem("tailoring_token");
    if (!token) { setLoading(false); return; }
    getMe().then(r => setUser(r.data)).catch(() => localStorage.removeItem("tailoring_token"); sessionStorage.removeItem("tailoring_token")).finally(() => setLoading(false));
  }, []);
  async function login(username: string, password: string, rememberMe: boolean) {
    const result = await loginRequest(username, password, rememberMe);
    localStorage.removeItem("tailoring_token");
    sessionStorage.removeItem("tailoring_token");
    (rememberMe ? localStorage : sessionStorage).setItem("tailoring_token", result.data.token);
    setUser(result.data.user);
  }
  function logout() { localStorage.removeItem("tailoring_token"); sessionStorage.removeItem("tailoring_token"); setUser(null); }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}