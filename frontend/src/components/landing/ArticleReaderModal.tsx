import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, BookOpen, ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export interface BlogArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  author: string;
  paragraphs: string[];
  keyTakeaways: string[];
  featureLink?: string;
  featureLabel?: string;
}

interface ArticleReaderModalProps {
  article: BlogArticle | null;
  onClose: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && article) {
        onClose();
      }
    };

    if (article) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-reader-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#06060c]/85 backdrop-blur-xl transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-[#121222] border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.2),0_25px_50px_-12px_rgba(0,0,0,0.9)] z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#16162a]/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {article.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readTime}
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close article"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer border border-white/[0.06] hover:border-purple-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Article Body */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-300">
            <div className="space-y-3">
              <h2 id="article-reader-title" className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                {article.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-4 border-b border-white/[0.06]">
                <span>By {article.author}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {article.date}</span>
              </div>
            </div>

            {/* Key Takeaways Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2.5">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Key Takeaways
              </h4>
              <ul className="space-y-2">
                {article.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-300">
              {article.paragraphs.map((para, idx) => (
                <p key={idx} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Interactive Call to Action Banner */}
            {article.featureLink && (
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-white">Put this into practice in StudySphere AI</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Explore the dedicated feature built for this workflow</p>
                  </div>
                  <Link
                    to={article.featureLink}
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/25 flex items-center gap-2 whitespace-nowrap transition-transform hover:scale-105"
                  >
                    <span>{article.featureLabel || "Try Now"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-[#10101e] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>StudySphere AI Learning Library</span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Done Reading
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
