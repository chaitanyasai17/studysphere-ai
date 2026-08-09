import React, { useContext, useEffect, useState } from "react";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin" | "superadmin" | "moderator" | "support";
  is_verified: boolean;
  avatar?: string;
}

export interface SyncStatsData {
  xp: number;
  coins: number;
  dailyChallengeClaimed?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  lastActivity: number;
  expiresAt: number | null;
  statsSync: SyncStatsData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUserVerification: () => void;
  updateUser: (data: Partial<User>) => void;
  syncStats: (xp: number, coins: number, dailyChallengeClaimed?: boolean) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getExpFromToken = (token: string): number | null => {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload && payload.exp) {
        return payload.exp * 1000;
      }
    }
  } catch (e) {
    // Fail silently
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [statsSync, setStatsSync] = useState<SyncStatsData | null>(null);

  // Expose computed authentication state
  const isAuthenticated = user !== null;

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setExpiresAt(getExpFromToken(token));
    }
    
    const savedActivity = localStorage.getItem("lastActivity");
    if (savedActivity) {
      setLastActivity(parseInt(savedActivity, 10));
    }
    
    setLoading(false);
  }, []);

  // Broadcast and storage event synchronization listeners
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("studysphere_auth_channel");
    } catch (e) {
      // Fallback if BroadcastChannel fails or is not supported
    }

    const handleMessage = (event: MessageEvent) => {
      const { type, accessToken, user: msgUser, stats } = event.data;
      if (type === "LOGIN") {
        setUser(msgUser);
        if (accessToken) setExpiresAt(getExpFromToken(accessToken));
      } else if (type === "LOGOUT") {
        setUser(null);
        setExpiresAt(null);
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login?session_expired=true";
        }
      } else if (type === "TOKEN_REFRESH") {
        if (accessToken) setExpiresAt(getExpFromToken(accessToken));
        if (msgUser) setUser(msgUser);
      } else if (type === "SYNC_STATS") {
        setStatsSync(stats);
      }
    };

    if (channel) {
      channel.addEventListener("message", handleMessage);
    }

    // Local tab synchronization trigger handler
    const handleSyncUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    window.addEventListener("storage_sync_user", handleSyncUser);

    // Fallback storage sync listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        const val = e.newValue;
        if (val) {
          setExpiresAt(getExpFromToken(val));
          const savedUser = localStorage.getItem("user");
          if (savedUser) setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
          setExpiresAt(null);
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login?session_expired=true";
          }
        }
      } else if (e.key === "user") {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        }
      } else if (e.key === "stats_sync_data") {
        if (e.newValue) {
          setStatsSync(JSON.parse(e.newValue));
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (channel) {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      }
      window.removeEventListener("storage_sync_user", handleSyncUser);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Window activity tracking event listeners
  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      localStorage.setItem("lastActivity", now.toString());
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("touchstart", updateActivity);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
    };
  }, []);

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { access_token, refresh_token, user: userData } = res.data;
      
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setExpiresAt(getExpFromToken(access_token));

      // Broadcast login to other tabs
      try {
        const channel = new BroadcastChannel("studysphere_auth_channel");
        channel.postMessage({
          type: "LOGIN",
          user: userData,
          accessToken: access_token,
          refreshToken: refresh_token
        });
        channel.close();
      } catch (e) {
        // Fallback triggers standard storage event
        localStorage.setItem("authSyncTimestamp", Date.now().toString());
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/api/auth/register", { name, email, password });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setExpiresAt(null);

    // Broadcast logout to other tabs
    try {
      const channel = new BroadcastChannel("studysphere_auth_channel");
      channel.postMessage({ type: "LOGOUT" });
      channel.close();
    } catch (e) {
      localStorage.setItem("authLogoutTimestamp", Date.now().toString());
    }
  };

  const verifyEmail = async (token: string) => {
    await api.post("/api/auth/verify-email", { token });
    if (user) {
      const updatedUser = { ...user, is_verified: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post("/api/auth/forgot-password", { email });
    return res.data;
  };

  const resetPassword = async (token: string, password: string) => {
    await api.post("/api/auth/reset-password", { token, password });
  };

  const updateUserVerification = () => {
    if (user) {
      const updated = { ...user, is_verified: true };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    }
  };

  const syncStats = (xp: number, coins: number, dailyChallengeClaimed?: boolean) => {
    const stats = { xp, coins, dailyChallengeClaimed };
    setStatsSync(stats);
    try {
      const channel = new BroadcastChannel("studysphere_auth_channel");
      channel.postMessage({ type: "SYNC_STATS", stats });
      channel.close();
    } catch (e) {
      localStorage.setItem("stats_sync_data", JSON.stringify(stats));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isOnline,
        lastActivity,
        expiresAt,
        statsSync,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        updateUserVerification,
        updateUser,
        syncStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
