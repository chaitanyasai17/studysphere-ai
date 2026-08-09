import React from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans relative overflow-hidden">
      
      {/* Background radial glow layers */}
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full filter blur-[130px] bg-purple-500/5 dark:bg-purple-600/5 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[45vw] h-[45vw] rounded-full filter blur-[130px] bg-blue-500/5 dark:bg-blue-600/5 pointer-events-none z-0" />

      {/* Brand visual column (Left 5-columns) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-[#0B0B12] overflow-hidden border-r border-slate-200/60 dark:border-white/5 z-10 select-none">
        
        {/* Subtle radial glow layers inside the left panel */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12)_0%,transparent_60%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08)_0%,transparent_60%)] pointer-events-none z-0" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">
            StudySphere AI
          </span>
        </div>

        {/* Central visual workspace */}
        <div className="my-auto z-10 w-full max-w-sm space-y-8 relative">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white leading-tight">
              A premium space built for intelligence.
            </h2>
            <p className="text-[#A1A1AA] text-xs leading-relaxed">
              Explore dynamic workspaces curated to accelerate textbook extraction, code playbooks, quiz agendas, and workspace highlights.
            </p>
          </div>

          {/* Floating cards canvas */}
          <div className="relative w-full h-[320px] flex items-center justify-center mt-6">
            {/* Central node */}
            <div className="w-32 h-32 rounded-full bg-purple-500/5 dark:bg-purple-500/10 flex items-center justify-center border border-purple-500/15 backdrop-blur-sm z-0">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>

            {/* Floating micro-cards */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 left-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">🤖</span>
              <span className="text-[10px] font-bold text-white/95">AI Tutor</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-8 right-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">📄</span>
              <span className="text-[10px] font-bold text-white/95">PDF Learning</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-8 left-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">🧠</span>
              <span className="text-[10px] font-bold text-white/95">Quiz Generator</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-10 right-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">🎴</span>
              <span className="text-[10px] font-bold text-white/95">Flashcards</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="absolute top-1/2 left-[-16px] -translate-y-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">📝</span>
              <span className="text-[10px] font-bold text-white/95">AI Notes</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-1/2 right-[-16px] -translate-y-1/2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.25)] flex items-center gap-1.5 text-white"
            >
              <span className="text-xs">💻</span>
              <span className="text-[10px] font-bold text-white/95">Coding Playground</span>
            </motion.div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-[10px] text-slate-500">
          StudySphere AI. Built with intelligence.
        </div>
      </div>

      {/* Forms column (Right 7-columns) */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-6 lg:p-12 z-10 relative">
        <div className="w-full max-w-[520px] rounded-[28px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111114] p-8 md:p-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {children}
        </div>
      </div>

    </div>
  );
};
