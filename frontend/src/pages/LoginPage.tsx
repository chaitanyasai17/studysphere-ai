import React, { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSessionExpired, setShowSessionExpired] = useState(searchParams.get("session_expired") === "true");

  const clearErrors = () => {
    setError(null);
    setShowSessionExpired(false);
  };

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
      let fromPath = "";
      if (typeof stateFrom === "string") {
        fromPath = stateFrom;
      } else if (stateFrom && typeof stateFrom === "object") {
        if (stateFrom.pathname) {
          fromPath = stateFrom.pathname + (stateFrom.search || "");
        }
      }
      if (!fromPath) {
        fromPath = searchParams.get("redirect") || searchParams.get("from") || "";
      }
      navigate(fromPath || "/dashboard");
    } catch (err: any) {
      console.error(err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
        addToast("Login Failed", serverMsg, "error");
      } else {
        const connMsg = "Could not connect to backend server. Please verify VITE_API_URL configuration.";
        setError(connMsg);
        addToast("Connection Error", connMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-sm text-slate-400">Sign in to continue learning</p>
      </div>

      {showSessionExpired && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              className="bg-[#0a0a12] border border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none w-full transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              className="bg-[#0a0a12] border border-white/[0.06] rounded-xl pl-12 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none w-full transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/[0.1] bg-[#0a0a12] text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-400">Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl px-6 py-3 font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="pt-4 text-center sm:text-left space-y-4">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Register
          </Link>
        </p>
        <div className="pt-4 border-t border-white/[0.06]">
          <Link to="/admin/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center sm:justify-start gap-1">
            Admin Login <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
