import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building, Mail, Send, CheckCircle2, Sparkles } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationsContext";

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSalesModal: React.FC<ContactSalesModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useNotifications();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    teamSize: "25-100",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setSubmitted(false);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast("Required Fields", "Please provide your name and work email.", "warning");
      return;
    }

    setSubmitted(true);
    addToast("Inquiry Received", "Our Enterprise team will contact you within 24 hours.", "success");
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-sales-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#06060c]/85 backdrop-blur-xl transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-[#121222] border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.25),0_25px_50px_-12px_rgba(0,0,0,0.9)] z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#16162a]/95">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 id="contact-sales-title" className="text-sm font-bold text-white tracking-tight">
                  StudySphere Enterprise
                </h3>
                <p className="text-[11px] text-slate-400">Custom solutions for universities & organizations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-white/[0.08] text-white focus:border-purple-500 outline-none text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-white/[0.08] text-white focus:border-purple-500 outline-none text-xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Organization</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="University or Company"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090912] border border-white/[0.08] text-white focus:border-purple-500 outline-none text-xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Est. Student Count</label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#090912] border border-white/[0.08] text-white focus:border-purple-500 outline-none text-xs transition-colors"
                    >
                      <option value="10-50">10 - 50 students</option>
                      <option value="50-250">50 - 250 students</option>
                      <option value="250-1000">250 - 1,000 students</option>
                      <option value="1000+">1,000+ students</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Requirements or Note</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your learning objectives, deployment timeline, or LMS integration needs..."
                    className="w-full p-3 rounded-xl bg-[#090912] border border-white/[0.08] text-white focus:border-purple-500 outline-none text-xs transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer mt-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Enterprise Request</span>
                </button>
              </form>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Thank You for Reaching Out</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Our enterprise academic coordinator will contact you at <span className="text-white font-medium">{formData.email}</span> shortly.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
