import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Mail, Check, Loader2, AlertCircle } from "lucide-react";

export const EmailVerificationPage: React.FC = () => {
  const { verifyEmail, updateUserVerification } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Auto-verify if token is present in URL query on load
  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (queryToken) {
      setToken(queryToken);
      autoVerify(queryToken);
    }
  }, [searchParams]);

  const autoVerify = async (val: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyEmail(val);
      setVerified(true);
      addToast("Email Verified", "Your account is active.", "success");
      updateUserVerification();
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    await autoVerify(token);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Email Verification</h1>
        <p className="text-xs text-slate-500">
          Verify your identity to unlock all premium AI tutor modules
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {verified ? (
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <Check className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verification Success!</h3>
            <p className="text-xs text-slate-500">Redirecting you to the dashboard...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Verification Code / Token
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Paste code from email logs"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-655/15 disabled:opacity-50 transition-all hover:shadow-indigo-655/20 active:scale-98"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Verify Account</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
