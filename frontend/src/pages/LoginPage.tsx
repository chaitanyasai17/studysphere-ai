import React, { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for session expiry message
  const [showSessionExpired, setShowSessionExpired] = useState(searchParams.get("session_expired") === "true");

  const clearErrors = () => {
    setError(null);
    setShowSessionExpired(false);
  };

  // Clean up the URL parameter so refreshing doesn't show it again
  React.useEffect(() => {
    if (searchParams.get("session_expired") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("session_expired");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      addToast("Welcome back!", "Successfully authenticated.", "success");
      
      const stateFrom = (location.state as any)?.from;
      const from = stateFrom ? (stateFrom.pathname + (stateFrom.search || "")) : "";
      navigate(from || "/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please verify and retry."
      );
      addToast("Login Failed", "Check your inputs and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Centered Logo, Header & Subtitle */}
      <div className="flex flex-col items-center text-center space-y-4 pb-4 select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            StudySphere AI
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
            Intelligent Learning Platform
          </p>
        </div>
      </div>

      {showSessionExpired && (
        <div className="p-3.5 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-amber-500 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email address field wrapper */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2"
        >
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              className="w-full h-14 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder:text-slate-400"
              required
            />
          </div>
        </motion.div>

        {/* Password field wrapper */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-bold text-indigo-500 hover:text-indigo-650 transition-colors animate-fade-in"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              className="w-full h-14 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 placeholder:text-slate-400"
              required
            />
          </div>
        </motion.div>

        {/* Action buttons controls */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all hover:shadow-indigo-650/25 active:scale-98 cursor-pointer border border-white/5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="border-t border-slate-200/50 dark:border-slate-850 pt-6 text-center text-xs text-slate-500 select-none">
        New to StudySphere?{" "}
        <Link
          to="/register"
          className="font-bold text-indigo-500 hover:text-indigo-650 transition-colors"
        >
          Create an account
        </Link>
      </div>
    </motion.div>
  );
};
