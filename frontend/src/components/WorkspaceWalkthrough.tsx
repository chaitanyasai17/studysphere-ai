import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Code,
  Terminal,
  Sparkles,
  Lock
} from "lucide-react";
import { AiTutorDemo } from "./workspace-demos/AiTutorDemo";
import { PdfReaderDemo } from "./workspace-demos/PdfReaderDemo";
import { CompilerDemo } from "./workspace-demos/CompilerDemo";
import { CyberLabDemo } from "./workspace-demos/CyberLabDemo";

type TabId = "tutor" | "pdf" | "compiler" | "cyber";

interface TabItem {
  id: TabId;
  label: string;
  badge: string;
  icon: React.ReactNode;
  accentGlow: string;
}

const TABS: TabItem[] = [
  {
    id: "tutor",
    label: "AI TUTOR",
    badge: "General Tutoring Mode",
    icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
    accentGlow: "rgba(168,85,247,0.3)"
  },
  {
    id: "pdf",
    label: "PDF READER",
    badge: "Textbook RAG Analyst",
    icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    accentGlow: "rgba(56,189,248,0.3)"
  },
  {
    id: "compiler",
    label: "COMPILER",
    badge: "Python 3.12 Sandbox",
    icon: <Code className="w-4 h-4 text-emerald-400" />,
    accentGlow: "rgba(52,211,153,0.3)"
  },
  {
    id: "cyber",
    label: "CYBER LABS",
    badge: "Stateful Linux Lab",
    icon: <Terminal className="w-4 h-4 text-rose-400" />,
    accentGlow: "rgba(251,113,133,0.3)"
  }
];

export const WorkspaceWalkthrough: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("tutor");
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Auto-cycle tabs every 8 seconds when user is not hovering or interacting
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = TABS.findIndex((t) => t.id === prev);
        const nextIndex = (currentIndex + 1) % TABS.length;
        return TABS[nextIndex].id;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setUserInteracted(true);
    setIsPaused(true);
  };

  const activeTabObj = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section 
      id="walkthrough" 
      className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 space-y-10 text-center relative select-none"
    >
      {/* Background ambient lighting & faint grid pattern */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[950px] h-[500px] bg-gradient-to-r from-purple-600/10 via-indigo-500/10 to-sky-500/10 blur-[130px] rounded-full pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />

      {/* Header Section Entrance Animation */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-4 max-w-2xl mx-auto relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> Live Product Simulation
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          Workspace Walkthrough
        </h2>
        <p className="text-xs sm:text-sm lg:text-[15px] text-[#C5CAD3] leading-relaxed">
          Toggle between tabs to see StudySphere AI's live interactive modules in action.
        </p>
      </motion.div>

      {/* Interactive Feature Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 flex justify-center"
      >
        <div 
          className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-slate-800 bg-[#12131A]/90 backdrop-blur-xl shadow-2xl max-w-full overflow-x-auto no-scrollbar"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            if (!userInteracted) setIsPaused(false);
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer whitespace-nowrap outline-none ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeWalkthroughTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    style={{
                      boxShadow: `0 0 20px ${tab.accentGlow}`
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Main Workspace Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="max-w-5xl mx-auto relative z-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!userInteracted) setIsPaused(false);
        }}
      >
        {/* Outer glowing border card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group">
          {/* Subtle animated glowing border highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent animate-pulse" />

          {/* Window Frame Inner Content */}
          <div className="rounded-2xl border border-slate-855 bg-[#0D0E15] overflow-hidden min-h-[420px] sm:min-h-[460px] flex flex-col justify-between text-left relative">
            
            {/* Header Bar */}
            <div className="px-4 py-3 border-b border-slate-855 bg-[#12131C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-3.5 w-[1px] bg-slate-800 mx-1" />
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  <span>app.studysphere.ai/{activeTabObj.id}</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  {activeTabObj.badge}
                </span>
              </div>
            </div>

            {/* Live Interactive Workspace Demos with Smooth Transitions */}
            <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between relative overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === "tutor" && (
                  <motion.div
                    key="tutor"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="h-full"
                  >
                    <AiTutorDemo />
                  </motion.div>
                )}

                {activeTab === "pdf" && (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="h-full"
                  >
                    <PdfReaderDemo />
                  </motion.div>
                )}

                {activeTab === "compiler" && (
                  <motion.div
                    key="compiler"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="h-full"
                  >
                    <CompilerDemo />
                  </motion.div>
                )}

                {activeTab === "cyber" && (
                  <motion.div
                    key="cyber"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="h-full"
                  >
                    <CyberLabDemo />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
