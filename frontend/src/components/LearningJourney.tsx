import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  MessageSquare,
  BookOpen,
  Zap,
  Code,
  Shield,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Compass,
  ChevronRight
} from "lucide-react";

interface JourneyStage {
  step: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  badge: string;
  color: string;
  glow: string;
}

const STAGES: JourneyStage[] = [
  {
    step: "01",
    title: "Learn",
    subtitle: "AI-Powered Explanations",
    desc: "Interactive AI Tutor with different learning modes and intelligent explanations.",
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
    path: "/ai",
    badge: "AI Tutor",
    color: "from-purple-500/20 to-indigo-500/20",
    glow: "rgba(168,85,247,0.3)"
  },
  {
    step: "02",
    title: "Understand",
    subtitle: "Document Context RAG",
    desc: "Upload and explore PDF documents with AI-assisted learning and document understanding.",
    icon: <BookOpen className="w-5 h-5 text-sky-400" />,
    path: "/pdf",
    badge: "PDF Reader",
    color: "from-sky-500/20 to-indigo-500/20",
    glow: "rgba(56,189,248,0.3)"
  },
  {
    step: "03",
    title: "Practice",
    subtitle: "Spaced Repetition Decks",
    desc: "Use Flashcards and active recall to strengthen memory and track learning progress.",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    path: "/flashcards",
    badge: "Active Flashcards",
    color: "from-amber-500/20 to-orange-500/20",
    glow: "rgba(251,191,36,0.3)"
  },
  {
    step: "04",
    title: "Build",
    subtitle: "Sandboxed Code IDE",
    desc: "Practice programming inside the integrated Code IDE with code execution and complexity analysis.",
    icon: <Code className="w-5 h-5 text-emerald-400" />,
    path: "/coding",
    badge: "Code IDE",
    color: "from-emerald-500/20 to-teal-500/20",
    glow: "rgba(52,211,153,0.3)"
  },
  {
    step: "05",
    title: "Secure",
    subtitle: "Stateful Security Labs",
    desc: "Explore the Cyber Lab with cybersecurity-focused learning and hands-on exercises.",
    icon: <Shield className="w-5 h-5 text-rose-400" />,
    path: "/cybersecurity",
    badge: "Cyber Lab",
    color: "from-rose-500/20 to-red-500/20",
    glow: "rgba(251,113,133,0.3)"
  },
  {
    step: "06",
    title: "Prepare",
    subtitle: "ATS & Mock Interviews",
    desc: "Improve your resume using ATS Resume Analyzer and practice interviews using the Mock Interview Recruiter.",
    icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
    path: "/resume",
    badge: "Career Hub",
    color: "from-cyan-500/20 to-blue-500/20",
    glow: "rgba(34,211,238,0.3)"
  },
  {
    step: "07",
    title: "Plan",
    subtitle: "Study Timelines & Milestones",
    desc: "Organize learning goals, tasks, and study sessions with the Study Planner.",
    icon: <Calendar className="w-5 h-5 text-indigo-400" />,
    path: "/planner",
    badge: "Study Planner",
    color: "from-indigo-500/20 to-purple-500/20",
    glow: "rgba(129,140,248,0.3)"
  }
];

export const LearningJourney: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const handleStageNavigate = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login", { state: { from: path } });
    }
  };

  return (
    <section id="journey" className="max-w-[1440px] mx-auto px-6 space-y-16 select-none relative">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[800px] h-[400px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Header Section Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto space-y-4 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
          <Compass className="w-3.5 h-3.5" /> Structured Learning Path
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          Your Complete AI Learning Journey
        </h2>
        <p className="text-sm sm:text-base text-[#C5CAD3] leading-relaxed">
          From learning and practice to career preparation — everything you need in one intelligent workspace.
        </p>
      </motion.div>

      {/* Horizontal Interactive Step Navigation Bar (Desktop & Tablet) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 hidden md:block max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between relative">
          {/* Animated Connecting Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
          <motion.div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 z-0"
            animate={{
              width: `${(activeStepIdx / (STAGES.length - 1)) * 92}%`
            }}
            transition={{ duration: 0.4 }}
          />

          {/* Timeline Nodes */}
          {STAGES.map((s, idx) => {
            const isActive = activeStepIdx === idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStepIdx(idx)}
                onMouseEnter={() => setActiveStepIdx(idx)}
                className={`relative z-10 flex flex-col items-center gap-2 group cursor-pointer outline-none`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white scale-110 shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/20"
                      : "bg-[#12131A] text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {s.step}
                </div>
                <span
                  className={`text-[11px] font-bold tracking-tight transition-colors ${
                    isActive ? "text-purple-300" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 7 Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {STAGES.map((s, idx) => {
          const isActive = activeStepIdx === idx;
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onMouseEnter={() => setActiveStepIdx(idx)}
              onClick={() => handleStageNavigate(s.path)}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                isActive
                  ? "bg-slate-900/80 border-purple-500/40 shadow-2xl"
                  : "bg-white/5 dark:bg-slate-900/40 border-slate-800 hover:border-slate-700"
              }`}
              style={{
                boxShadow: isActive ? `0 0 30px ${s.glow}` : undefined
              }}
            >
              {/* Subtle top gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color} opacity-80`} />

              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-700 font-mono group-hover:text-purple-400 transition-colors">
                    {s.step}
                  </span>
                </div>

                {/* Stage Title & Subtitle */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 block">
                    Stage {s.step} • {s.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">{s.subtitle}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-[#C5CAD3] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              {/* Action Button Link */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-purple-300 transition-colors">
                <span className="flex items-center gap-1">
                  <span>Explore Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[9px] font-mono uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-purple-300">
                  Ready
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strong Bottom CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto z-10 relative"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-950/80 border border-purple-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-purple-500/15 filter blur-[80px] pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Ready to Start Your Journey?
            </h3>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Join thousands of students mastering complex subjects, building placement projects, and preparing for top engineering careers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
            <button
              onClick={() => handleStageNavigate("/dashboard")}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Explore StudySphere</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>View Features</span>
              <ChevronRight className="w-4 h-4 text-purple-400" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
