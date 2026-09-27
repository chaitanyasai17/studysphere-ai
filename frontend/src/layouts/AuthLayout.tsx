import React from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0a12] text-white font-sans relative overflow-hidden">
      
      {/* Left panel - Brand */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-[#0a0a12] overflow-hidden z-10 border-r border-white/[0.06]">
        {/* Gradients */}
        <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full filter blur-[130px] bg-purple-500/10 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 w-[45vw] h-[45vw] rounded-full filter blur-[130px] bg-blue-500/10 pointer-events-none z-0" />
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            StudySphere AI
          </span>
        </div>

        {/* Content */}
        <div className="my-auto z-10 w-full max-w-lg space-y-8 relative">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white leading-tight">
              A premium space built for intelligence.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Explore dynamic workspaces curated to accelerate textbook extraction, code playbooks, quiz agendas, and workspace highlights.
            </p>
          </div>

          {/* Floating cards */}
          <div className="relative w-full h-[320px] flex items-center justify-center mt-12">
            <div className="w-32 h-32 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 backdrop-blur-sm z-0">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>

            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-4 left-10 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#161625]/80 backdrop-blur-md flex items-center gap-2 text-white">
              <span className="text-sm">🤖</span>
              <span className="text-xs font-bold text-white">AI Tutor</span>
            </motion.div>

            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-8 right-10 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#161625]/80 backdrop-blur-md flex items-center gap-2 text-white">
              <span className="text-sm">📄</span>
              <span className="text-xs font-bold text-white">PDF Learning</span>
            </motion.div>

            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-8 left-4 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#161625]/80 backdrop-blur-md flex items-center gap-2 text-white">
              <span className="text-sm">🧠</span>
              <span className="text-xs font-bold text-white">Quiz Generator</span>
            </motion.div>

            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-12 right-4 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#161625]/80 backdrop-blur-md flex items-center gap-2 text-white">
              <span className="text-sm">💻</span>
              <span className="text-xs font-bold text-white">Coding Playground</span>
            </motion.div>
          </div>
        </div>

        <div className="z-10 text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} StudySphere AI. Built with intelligence.
        </div>
      </div>

      {/* Right panel - Form container */}
      <div className="flex items-center justify-center p-6 lg:p-12 z-10 relative bg-[#0a0a12]">
        <div className="w-full max-w-[480px] bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-8 md:p-12 shadow-2xl relative">
          {children}
        </div>
      </div>
    </div>
  );
};
