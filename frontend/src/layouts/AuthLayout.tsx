import React from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Code2, 
  Users, 
  ChevronRight,
  Zap,
  Clock,
  GraduationCap
} from "lucide-react";
import { motion } from "framer-motion";

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const featureCards = [
    {
      title: "AI Tutor",
      desc: "Get instant help",
      icon: MessageSquare,
      color: "text-indigo-400",
      bg: "bg-indigo-500/15 border-indigo-500/30",
    },
    {
      title: "PDF Learning",
      desc: "Summarize & learn",
      icon: BookOpen,
      color: "text-purple-400",
      bg: "bg-purple-500/15 border-purple-500/30",
    },
    {
      title: "Smart Notes",
      desc: "Organize & revise",
      icon: FileText,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15 border-emerald-500/30",
    },
    {
      title: "Quiz Generator",
      desc: "Test your knowledge",
      icon: HelpCircle,
      color: "text-pink-400",
      bg: "bg-pink-500/15 border-pink-500/30",
    },
    {
      title: "Coding Playground",
      desc: "Practice coding",
      icon: Code2,
      color: "text-cyan-400",
      bg: "bg-cyan-500/15 border-cyan-500/30",
    },
    {
      title: "Mock Interviews",
      desc: "Ace your next interview",
      icon: Users,
      color: "text-amber-400",
      bg: "bg-amber-500/15 border-amber-500/30",
    },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#06060c] text-white font-sans relative overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle cyber grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Ambient violet nebulae */}
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[140px] bg-purple-700/15 pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[130px] bg-indigo-700/15 pointer-events-none" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] bg-violet-600/15 pointer-events-none" />
        
        {/* Curved energy trails */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="curveGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="curveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M -100 600 C 300 450, 600 700, 1200 400" stroke="url(#curveGrad1)" strokeWidth="2" fill="none" />
          <path d="M 100 800 C 500 600, 900 850, 1600 500" stroke="url(#curveGrad2)" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* ============================================================ */}
      {/* LEFT COLUMN: BRAND HERO & PLATFORM SHOWCASE (Desktop only) */}
      {/* ============================================================ */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 xl:p-14 z-10 border-r border-white/[0.05] min-h-screen">
        
        {/* Top: Logo Branding */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              StudySphere AI
            </span>
          </Link>
        </div>

        {/* Center: Hero Headline & Feature Cards */}
        <div className="my-auto py-8 space-y-7 max-w-xl">
          
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">
              AI-Powered Learning Platform
            </span>
          </div>

          {/* Large Bold Headline */}
          <div className="space-y-1">
            <h1 className="text-4xl xl:text-5xl 2xl:text-[54px] font-black text-white leading-[1.12] tracking-tight">
              Learn Smarter.
            </h1>
            <h1 className="text-4xl xl:text-5xl 2xl:text-[54px] font-black leading-[1.12] tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Build Skills.
            </h1>
            <h1 className="text-4xl xl:text-5xl 2xl:text-[54px] font-black text-white leading-[1.12] tracking-tight">
              Grow Faster.
            </h1>
          </div>

          {/* Subtitle Description */}
          <p className="text-slate-400 text-sm xl:text-[15px] leading-relaxed max-w-lg font-normal">
            Your all-in-one AI learning platform with AI tutor, PDF learning, smart notes, quizzes, coding playground, mock interviews, resume assistant, and cybersecurity labs.
          </p>

          {/* 6 Feature Chips Grid (2 cols x 3 rows) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {featureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                  whileHover={{ y: -2, borderColor: "rgba(168, 85, 247, 0.4)" }}
                  className="bg-[#12121e]/70 hover:bg-[#161628]/90 border border-white/[0.07] rounded-2xl p-3 xl:p-3.5 backdrop-blur-md transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${card.bg} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs xl:text-sm font-semibold text-white truncate">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {card.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
                </motion.div>
              );
            })}
          </div>

          {/* Horizontal Statistics Dock */}
          <div className="bg-[#0f0f1c]/80 border border-white/[0.06] rounded-2xl p-4 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.3)] grid grid-cols-4 gap-2 text-center divide-x divide-white/[0.05]">
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1.5 text-white font-bold text-sm xl:text-base">
                <Users className="w-4 h-4 text-purple-400" />
                <span>10K+</span>
              </div>
              <span className="text-[10px] xl:text-[11px] text-slate-400 mt-0.5 font-medium">Students</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1.5 text-white font-bold text-sm xl:text-base">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>50+</span>
              </div>
              <span className="text-[10px] xl:text-[11px] text-slate-400 mt-0.5 font-medium">Learning Topics</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs xl:text-sm">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI-Powered</span>
              </div>
              <span className="text-[10px] xl:text-[11px] text-slate-400 mt-0.5 font-medium truncate w-full">Personalized</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1.5 text-white font-bold text-sm xl:text-base">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>24/7</span>
              </div>
              <span className="text-[10px] xl:text-[11px] text-slate-400 mt-0.5 font-medium">AI Support</span>
            </div>
          </div>

        </div>

        {/* Bottom Left: Copyright notice */}
        <div className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} StudySphere AI. Built with intelligence.
        </div>

      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: LOGIN FORM CARD (Desktop & Mobile) */}
      {/* ============================================================ */}
      <div className="flex flex-col justify-between items-center p-6 sm:p-10 lg:p-12 z-10 relative min-h-screen">
        
        {/* Mobile Header Branding (Visible on mobile & tablet) */}
        <div className="w-full flex items-center justify-between lg:hidden mb-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              StudySphere AI
            </span>
          </Link>
          <div className="text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full font-semibold">
            AI Platform
          </div>
        </div>

        {/* Centered Glass Form Card Container */}
        <div className="my-auto w-full max-w-[460px]">
          {children}
        </div>

        {/* Bottom Footer Links */}
        <div className="pt-8 pb-2 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <a href="mailto:support@studysphere.ai" className="hover:text-purple-400 transition-colors">Contact</a>
        </div>

      </div>

    </div>
  );
};
