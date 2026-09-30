import React, { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight 
} from "lucide-react";
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
  const [rememberMe, setRememberMe] = useState(true);
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError("Please fill in your email address and password.");
      return;
    }

    setLoading(true);

    try {
      await login(cleanEmail, cleanPassword);
      addToast("Welcome back!", "Successfully signed in to StudySphere AI.", "success");
      
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

      // Route admin users directly to /admin and students to /dashboard
      const savedUserStr = localStorage.getItem("user");
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const isAdmin = savedUser && ["superadmin", "admin", "moderator", "support"].includes(savedUser.role);
      const defaultDest = isAdmin ? "/admin" : "/dashboard";

      navigate(fromPath || defaultDest);
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      if (!err.response) {
        const connMsg = "Unable to connect to the backend server. Please verify your connection or check backend availability.";
        setError(connMsg);
        addToast("Connection Error", connMsg, "error");
      } else {
        const status = err.response.status;
        const serverMsg = err.response.data?.message;
        if (status === 401) {
          setError(serverMsg || "Invalid email or password. Please verify your credentials.");
          addToast("Authentication Failed", serverMsg || "Invalid email or password.", "error");
        } else if (status === 403) {
          setError(serverMsg || "Your account has been suspended. Please contact support.");
          addToast("Account Suspended", serverMsg || "Access forbidden.", "error");
        } else {
          setError(serverMsg || "Something went wrong on the server. Please try again.");
          addToast("Server Error", serverMsg || "Unexpected error occurred.", "error");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-[#12121c]/85 backdrop-blur-2xl border border-white/[0.09] rounded-[26px] p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_-10px_rgba(139,92,246,0.18)] relative overflow-hidden"
    >
      
      {/* Decorative ambient halo inside card top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-purple-500/20 to-transparent blur-2xl pointer-events-none" />

      {/* Card Header Section */}
      <div className="flex flex-col items-center text-center relative z-10 mb-6">
        
        {/* Brand Icon + Name */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            StudySphere AI
          </span>
        </div>

        {/* Welcome Back Title */}
        <h2 className="text-2xl sm:text-[28px] font-black text-white tracking-tight">
          Welcome Back
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
          Sign in to continue your learning journey
        </p>

        {/* Decorative Pill & Dot Indicator (Matching Mockup) */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-10 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
          <div className="w-1.5 h-1 bg-purple-400 rounded-full" />
        </div>
      </div>

      {/* Session Expired Notice Banner */}
      {showSessionExpired && (
        <div className="mb-5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2.5 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Your session has expired. Please sign in again.</span>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2.5 backdrop-blur-md"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </motion.div>
      )}

      {/* Primary Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 tracking-wide block">
            Email Address
          </label>
          <div className="relative flex items-center bg-[#090912]/80 border border-white/[0.08] focus-within:border-purple-500/60 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-xl transition-all duration-200">
            <Mail className="w-4 h-4 text-slate-500 ml-3.5 pointer-events-none flex-shrink-0" />
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              className="text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent py-2.5 sm:py-3 pl-2.5 pr-4 w-full outline-none"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 tracking-wide block">
            Password
          </label>
          <div className="relative flex items-center bg-[#090912]/80 border border-white/[0.08] focus-within:border-purple-500/60 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-xl transition-all duration-200">
            <Lock className="w-4 h-4 text-slate-500 ml-3.5 pointer-events-none flex-shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrors();
              }}
              className="text-xs sm:text-sm text-white placeholder:text-slate-500 bg-transparent py-2.5 sm:py-3 pl-2.5 pr-10 w-full outline-none font-mono"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/[0.15] bg-[#090912] text-purple-600 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-medium">Remember me</span>
          </label>

          <Link 
            to="/forgot-password" 
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Primary CTA Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 sm:h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm rounded-xl shadow-[0_0_25px_rgba(147,51,234,0.35)] hover:shadow-[0_0_35px_rgba(147,51,234,0.5)] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-6">
        <p className="text-xs sm:text-sm text-slate-400">
          Don't have an account?{" "}
          <Link 
            to="/register" 
            state={location.state}
            className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>

      {/* Admin Login Gateway Link */}
      <div className="text-center pt-4 mt-4 border-t border-white/[0.06]">
        <Link 
          to="/admin/login" 
          className="text-xs text-purple-400/80 hover:text-purple-300 font-medium tracking-wide inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Admin Login</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

    </motion.div>
  );
};
