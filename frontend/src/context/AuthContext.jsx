"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "@/lib/api";
import { disconnectSocket, reconnectSocket } from "@/lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("bv_token");
    const storedUser = localStorage.getItem("bv_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        authApi
          .getMe()
          .then(({ data }) => {
            setUser(data.user);
            localStorage.setItem("bv_user", JSON.stringify(data.user));
          })
          .catch((err) => {
            // Only clear auth on actual token failure (401/403).
            // Network errors (server temporarily down) should NOT log the user out.
            if (err.response?.status === 401 || err.response?.status === 403) {
              localStorage.removeItem("bv_token");
              localStorage.removeItem("bv_user");
              setUser(null);
            }
          })
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem("bv_token", data.token);
    localStorage.setItem("bv_user", JSON.stringify(data.user));
    setUser(data.user);
    reconnectSocket(data.token);
    return data;
  }, []);

  const register = useCallback(async (credentials) => {
    const { data } = await authApi.register(credentials);
    localStorage.setItem("bv_token", data.token);
    localStorage.setItem("bv_user", JSON.stringify(data.user));
    setUser(data.user);
    reconnectSocket(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");
    setUser(null);
    disconnectSocket();
    window.location.href = "/auth/login";
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("bv_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user?.role === "admin";
  const isBidder = user?.role === "bidder";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isBidder,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
