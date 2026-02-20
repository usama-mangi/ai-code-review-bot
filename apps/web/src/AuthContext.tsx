/// <reference types="vite/client" />
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create an Axios instance that always sends cookies
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

export interface User {
  id: number;
  githubId: number;
  username: string;
  avatarUrl: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const loginWithGitHub = () => {
    // Redirect the browser to the backend GitHub OAuth route
    window.location.href = `${api.defaults.baseURL}/auth/github`;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGitHub, logout }}>
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
