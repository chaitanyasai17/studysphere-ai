import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../contexts/NotificationsContext";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
  };

  const bgMap = {
    success: "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20",
    warning: "border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20",
    error: "border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20",
    info: "border-sky-500/20 bg-sky-500/5 dark:bg-sky-950/20",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${bgMap[t.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{iconMap[t.type]}</div>
            <div className="flex-grow">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
