import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Mail, Lock, ShieldAlert, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide complete credentials.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Authenticate via standard auth login
      await login(email, password);
      
      // Get the authenticated user from storage to check permissions
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const adminRoles = ["superadmin", "admin", "moderator", "support"];
        
        if (!adminRoles.includes(u.role)) {
          // If not admin role, clear auth and reject
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setError("Forbidden: Access restricted to authorized administrative personnel only.");
          addToast("Access Denied", "Administrator credentials required.", "error");
          setLoading(false);
          return;
        }
      }

      addToast("Portal Accessed", "Welcome to the Enterprise Admin Console.", "success");
      navigate("/admin");
    } catch (err: any) {
      if (!err.response) {
        const networkMsg = "Could not connect to backend server. Please verify your connection or check backend availability.";
        setError(networkMsg);
        addToast("Connection Error", networkMsg, "error");
      } else {
        const status = err.response.status;
        const serverMsg = err.response.data?.message;
        if (status === 401) {
          setError(serverMsg || "Invalid administrator email or password.");
          addToast("Authentication Failed", serverMsg || "Invalid credentials.", "error");
        } else if (status === 403) {
          setError(serverMsg || "Access forbidden: Account suspended or unauthorized.");
          addToast("Access Denied", serverMsg || "Unauthorized.", "error");
        } else {
          setError(serverMsg || `Server error (${status}). Please try again later.`);
          addToast("Server Error", serverMsg || "An unexpected server error occurred.", "error");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] font-sans relative overflow-hidden select-none p-6">
      {/* Animated Radial blur gradients background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 border border-white/[0.06] bg-[#161625] rounded-2xl hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 relative z-10 space-y-8"
      >
        
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0f0f1a] border border-white/[0.06] flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
            <p className="text-sm text-slate-400 mt-1">
              Enterprise Management Portal
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-3 leading-relaxed"
          >
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="admin@studysphere.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#0f0f1a] text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#0f0f1a] text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">
            Secure connection established. Unauthorized access is strictly prohibited.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
