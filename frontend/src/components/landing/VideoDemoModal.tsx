import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Sparkles, Volume2, Maximize2, AlertCircle, ArrowRight } from "lucide-react";

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExplorePreview?: () => void;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  onExplorePreview
}) => {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key and trap focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setVideoError(false);
      setIsPlaying(true);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-video-title"
      >
        {/* Backdrop blur with purple tint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#06060c]/85 backdrop-blur-xl transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-4xl bg-[#121222] border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.25),0_25px_50px_-12px_rgba(0,0,0,0.9)] z-10 flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#16162a]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 id="demo-video-title" className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  StudySphere AI Product Walkthrough
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    HD Preview
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">See AI tutoring, PDF chat, notes, and code practice in action</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close demo modal"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer border border-white/[0.06] hover:border-purple-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Player Frame */}
          <div className="relative w-full aspect-video bg-[#090912] flex items-center justify-center overflow-hidden">
            {!videoError ? (
              <video
                ref={videoRef}
                src="/demo/studysphere-demo.mp4"
                controls
                autoPlay
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              /* Graceful Fallback if /demo/studysphere-demo.mp4 is not uploaded yet */
              <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-lg space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600/30 to-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                    <Play className="w-9 h-9 fill-purple-400 text-purple-400 ml-1" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-white tracking-tight">
                    Demo Video Coming Soon
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    The video file is configured at <code className="px-1.5 py-0.5 rounded bg-black/40 text-purple-300 border border-white/[0.06] font-mono text-[11px]">/demo/studysphere-demo.mp4</code>. In the meantime, you can experience the interactive platform demo below!
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onExplorePreview) onExplorePreview();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  >
                    <span>Explore Interactive Walkthrough</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-white/[0.06] transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-[#10101e] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Interactive Platform Preview Available
            </span>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px] text-slate-300">ESC</kbd> to close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
