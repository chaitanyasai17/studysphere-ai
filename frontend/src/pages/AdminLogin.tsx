import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Mail, Lock, ShieldAlert, Loader2, KeyRound } from "lucide-react";

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
      setError(
        err.response?.data?.message || "Invalid administrator credentials."
      );
      addToast("Authentication Failed", "Verify your details and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] font-sans relative overflow-hidden select-none">
      {/* Animated Aurora blur gradients background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 border border-white/10 bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl relative z-10 space-y-8">
        
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Enterprise Console</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">
              Authorized Administrative Login
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[11px] flex items-center gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-450 block">
              Admin Username / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="administrator@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-black/40 text-white text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-455 block">
              Secure Credentials Access key
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-black/40 text-white text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-purple-500/10 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating admin key...
              </>
            ) : (
              "Authenticate Admin Credentials"
            )}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[9px] font-bold uppercase text-slate-600">
            StudySphere Enterprise Security Services v2.5
          </span>
        </div>
      </div>
    </div>
  );
};
