import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength logic
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getPasswordStrength();
  const strengthColors = ["bg-slate-700", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];
  const strengthText = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all details.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await register(name, email, password);
      addToast(
        "Account Created!",
        "Registration successful. Verification token generated.",
        "success"
      );
      if (data.verification_token) {
        navigate(`/verify-email?token=${data.verification_token}`, { state: location.state });
      } else {
        navigate("/login", { state: location.state });
      }
    } catch (err: any) {
      console.error(err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
        addToast("Registration Failed", serverMsg, "error");
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
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-sm text-slate-400">Start your learning journey</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0a0a12] border border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none w-full transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0a0a12] border border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none w-full transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {password && (
            <div className="pt-2">
              <div className="flex gap-1 h-1.5 w-full bg-[#0a0a12] rounded-full overflow-hidden border border-white/[0.06]">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-full flex-1 transition-colors duration-300 ${
                      strength >= level ? strengthColors[strength] : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs mt-1.5 font-medium ${strength >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {strengthText[strength]}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#0a0a12] border border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none w-full transition-all"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 rounded border-white/[0.1] bg-[#0a0a12] text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-400">I agree to the Terms of Service</span>
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
            <span>Register</span>
          )}
        </button>
      </form>

      <div className="pt-4 text-center sm:text-left">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};
