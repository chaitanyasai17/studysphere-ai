import React from "react";
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
  FileBadge,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface ExperienceModule {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  glow: string;
}

const MODULES: ExperienceModule[] = [
  {
    id: "ai",
    title: "AI-Powered Learning",
    desc: "Get intelligent explanations and personalized assistance across different learning modes.",
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
    path: "/ai",
    color: "from-purple-500/20 to-indigo-500/20",
    glow: "rgba(168,85,247,0.25)"
  },
  {
    id: "pdf",
    title: "PDF Learning Assistant",
    desc: "Upload study materials and interact with document content for better understanding and learning.",
    icon: <BookOpen className="w-5 h-5 text-sky-400" />,
    path: "/pdf",
    color: "from-sky-500/20 to-indigo-500/20",
    glow: "rgba(56,189,248,0.25)"
  },
  {
    id: "flashcards",
    title: "Active Flashcards",
    desc: "Create, review, and practice flashcards using active recall and spaced learning techniques.",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    path: "/flashcards",
    color: "from-amber-500/20 to-orange-500/20",
    glow: "rgba(251,191,36,0.25)"
  },
  {
    id: "coding",
    title: "Code Execution Environment",
    desc: "Write and execute programming code while exploring runtime behavior and code complexity concepts.",
    icon: <Code className="w-5 h-5 text-emerald-400" />,
    path: "/coding",
    color: "from-emerald-500/20 to-teal-500/20",
    glow: "rgba(52,211,153,0.25)"
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Learning Lab",
    desc: "Explore cybersecurity concepts and hands-on learning environments designed for practical skill development.",
    icon: <Shield className="w-5 h-5 text-rose-400" />,
    path: "/cybersecurity",
    color: "from-rose-500/20 to-red-500/20",
    glow: "rgba(251,113,133,0.25)"
  },
  {
    id: "ats",
    title: "ATS Resume Analyzer",
    desc: "Analyze resumes, identify important keywords, and receive suggestions for improving resume quality.",
    icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
    path: "/resume?tab=scan",
    color: "from-cyan-500/20 to-blue-500/20",
    glow: "rgba(34,211,238,0.25)"
  },
  {
    id: "interview",
    title: "Mock Interview Practice",
    desc: "Practice technical and HR interview questions and receive structured feedback on responses.",
    icon: <FileBadge className="w-5 h-5 text-violet-400" />,
    path: "/resume?tab=interview",
    color: "from-violet-500/20 to-purple-500/20",
    glow: "rgba(192,132,252,0.25)"
  },
  {
    id: "planner",
    title: "Study Planner",
    desc: "Organize study sessions, learning goals, tasks, and progress in one workspace.",
    icon: <Calendar className="w-5 h-5 text-indigo-400" />,
    path: "/planner",
    color: "from-indigo-500/20 to-purple-500/20",
    glow: "rgba(129,140,248,0.25)"
  }
];

export const LearningExperiences: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login", { state: { from: path } });
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <section id="experiences" className="max-w-[1440px] mx-auto px-6 space-y-16 select-none relative">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] max-w-[850px] h-[450px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

      {/* Header Section Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto space-y-4 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
          <Layers className="w-3.5 h-3.5" /> Integrated Learning Modules
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          One Platform. Multiple Learning Experiences.
        </h2>
        <p className="text-sm sm:text-base text-[#C5CAD3] leading-relaxed">
          StudySphere AI brings learning, practice, career preparation, and technical exploration together in one intelligent platform.
        </p>
      </motion.div>

      {/* 8 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {MODULES.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: idx * 0.06 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => handleCardClick(m.path)}
            className="p-6 rounded-3xl border border-slate-800 bg-white/5 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between cursor-pointer group hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden"
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
            }}
          >
            {/* Top Glowing Gradient Highlight */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color} opacity-80`} />

            <div className="space-y-4">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-purple-300 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#C5CAD3] leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-purple-300 transition-colors">
              <span>Explore Module</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto z-10 relative"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-950/80 border border-purple-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-purple-500/15 filter blur-[80px] pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Everything You Need to Learn, Practice and Grow.
            </h3>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Explore intelligent tools designed to support your learning journey from understanding concepts to preparing for your career.
            </p>
          </div>

          <div className="pt-2 relative z-10 flex justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
