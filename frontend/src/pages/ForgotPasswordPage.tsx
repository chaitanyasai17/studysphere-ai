import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import { Mail, ArrowRight, Loader2, AlertCircle, Info } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const { addToast } = useNotifications();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setResetToken(null);

    try {
      const data = await forgotPassword(email);
      addToast("Token Generated", "Simulation recovery token compiled.", "success");
      if (data.reset_token) {
        setResetToken(data.reset_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process forgot password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Recover Password</h1>
        <p className="text-xs text-slate-500">
          Enter your registered email address to receive a recovery token
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-500 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {resetToken ? (
        <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 flex flex-col gap-4">
          <div className="flex gap-2.5">
            <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">Simulation Mode Active</p>
              <p>An email would normally be sent. Use the simulated token below to reset your password:</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-center font-mono text-[11px] select-all cursor-pointer" title="Click to copy">
            {resetToken}
          </div>
          <Link
            to={`/reset-password?token=${resetToken}`}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs text-center block transition-colors"
          >
            Go to Password Reset
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all hover:shadow-indigo-655/20 active:scale-98"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send Reset Token</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="border-t border-slate-200/50 dark:border-slate-850 pt-6 text-center text-xs text-slate-500">
        Remember your password?{" "}
        <Link
          to="/login"
          className="font-bold text-indigo-500 hover:text-indigo-650 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
