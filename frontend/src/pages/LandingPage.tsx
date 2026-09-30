import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Sparkles,
  Play,
  ArrowRight,
  MessageSquare,
  BookOpen,
  FileText,
  HelpCircle,
  Code,
  Users,
  FileBadge,
  Shield,
  CheckCircle,
  TrendingUp,
  Cpu,
  Star,
  Globe,
  LayoutDashboard,
  FolderLock,
  Calendar,
  BarChart3,
  Lock,
  ShieldAlert,
  Check,
  Award,
  Zap,
  Flame
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleTryFeature = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login", { state: { from: path } });
    }
  };

  const features = [
    {
      title: "AI Tutor",
      desc: "Get instant, personalized explanations and guidance for complex topics.",
      icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
      color: "cyan",
      bgClass: "bg-cyan-500/10",
      borderHoverClass: "hover:border-cyan-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]",
      path: "/ai"
    },
    {
      title: "PDF Learning",
      desc: "Upload textbooks and chat directly with your course materials for insights.",
      icon: <BookOpen className="w-6 h-6 text-blue-400" />,
      color: "blue",
      bgClass: "bg-blue-500/10",
      borderHoverClass: "hover:border-blue-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
      path: "/pdf"
    },
    {
      title: "Smart Notes",
      desc: "Organize your thoughts with intelligent summarization and linking capabilities.",
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      color: "emerald",
      bgClass: "bg-emerald-500/10",
      borderHoverClass: "hover:border-emerald-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
      path: "/notes"
    },
    {
      title: "Quiz Generator",
      desc: "Test your knowledge with auto-generated flashcards and dynamic quizzes.",
      icon: <HelpCircle className="w-6 h-6 text-purple-400" />,
      color: "purple",
      bgClass: "bg-purple-500/10",
      borderHoverClass: "hover:border-purple-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
      path: "/quizzes"
    },
    {
      title: "Coding Playground",
      desc: "Write, run, and debug code in multiple languages right in your browser.",
      icon: <Code className="w-6 h-6 text-orange-400" />,
      color: "orange",
      bgClass: "bg-orange-500/10",
      borderHoverClass: "hover:border-orange-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]",
      path: "/coding"
    },
    {
      title: "Mock Interviews",
      desc: "Practice with AI recruiters to perfect your behavioral and technical responses.",
      icon: <Users className="w-6 h-6 text-pink-400" />,
      color: "pink",
      bgClass: "bg-pink-500/10",
      borderHoverClass: "hover:border-pink-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]",
      path: "/interview"
    },
    {
      title: "Resume Assistant",
      desc: "Optimize your resume for ATS systems with tailored keyword suggestions.",
      icon: <FileBadge className="w-6 h-6 text-amber-400" />,
      color: "amber",
      bgClass: "bg-amber-500/10",
      borderHoverClass: "hover:border-amber-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]",
      path: "/resume"
    },
    {
      title: "Cybersecurity Lab",
      desc: "Safe sandbox environments to practice ethical hacking and secure concepts.",
      icon: <Shield className="w-6 h-6 text-red-400" />,
      color: "red",
      bgClass: "bg-red-500/10",
      borderHoverClass: "hover:border-red-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
      path: "/cybersecurity"
    }
  ];

  return (
    <div className="bg-[#0a0a12] w-full min-h-screen overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 px-6 sm:px-8">
        {/* Subtle radial gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl"
          >
            Learn Smarter.<br />
            Build Skills.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-400">
              Grow Faster.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            StudySphere AI combines intelligent tutoring, code execution, and interview prep in one premium, unified workspace built for the modern student.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl font-semibold transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-8 flex flex-col items-center gap-3"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0a0a12] bg-slate-800 flex items-center justify-center overflow-hidden`}>
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User avatar" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <span>Trusted by 10,000+ learners</span>
            </div>
          </motion.div>
        </div>

        {/* 4 Stat Cards Row */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative z-10 w-full max-w-7xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 px-6"
        >
          {[
            { label: "10K+ Students", icon: <Users className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/10" },
            { label: "50+ Learning Topics", icon: <BookOpen className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/10" },
            { label: "AI-Powered Personalized Learning", icon: <Cpu className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/10" },
            { label: "24/7 AI Support", icon: <MessageSquare className="w-5 h-5 text-amber-400" />, bg: "bg-amber-500/10" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center p-6 bg-[#161625] border border-white/[0.06] rounded-2xl">
              <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <h4 className="text-sm font-semibold text-white leading-tight">{stat.label}</h4>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-24 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Everything You Need to Excel</h2>
            <p className="text-slate-400 text-lg">
              A complete suite of intelligent tools crafted to supercharge your learning and career preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => handleTryFeature(feature.path)}
                className={`group bg-[#161625] border border-white/[0.06] rounded-2xl p-6 cursor-pointer transition-all duration-300 ${feature.borderHoverClass} ${feature.shadowHoverClass}`}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgClass} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="py-24 px-6 sm:px-8 bg-[#0f0f1a] relative border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How It Works</h2>
            <p className="text-slate-400 text-lg">
              Your journey to mastery in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            
            {[
              { step: 1, title: "Sign Up & Set Goals", desc: "Create your profile, select your target domains, and outline your learning objectives.", icon: <CheckCircle className="w-6 h-6 text-purple-400" /> },
              { step: 2, title: "Learn with AI Assistance", desc: "Upload materials and interact with tailored tutors, quizzes, and sandboxed labs.", icon: <Sparkles className="w-6 h-6 text-blue-400" /> },
              { step: 3, title: "Track Progress & Grow", desc: "Monitor your analytics, build interview readiness, and achieve career milestones.", icon: <TrendingUp className="w-6 h-6 text-emerald-400" /> }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center space-y-4 z-10"
              >
                <div className="w-24 h-24 rounded-full bg-[#161625] border-4 border-[#0f0f1a] flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                  {item.step}
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm max-w-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Platform Preview Section */}
      <section className="py-32 px-6 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-2xl border border-purple-500/20 bg-[#161625]/90 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(139,92,246,0.25),0_25px_50px_-12px_rgba(0,0,0,0.9)] p-2 max-w-5xl mx-auto"
          >
            {/* Floating Decorative Badges — z-30 ensures fully visible outside/over frame, pointer-events-none ensures never blocking clicks */}
            <div 
              className="absolute -left-3 sm:-left-6 lg:-left-8 top-10 sm:top-12 bg-[#141426]/95 backdrop-blur-xl border border-purple-500/35 px-3.5 py-2.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(147,51,234,0.3)] items-center gap-3 hidden md:flex pointer-events-none select-none z-30" 
              style={{ animation: 'float 3s ease-in-out infinite' }}
              aria-hidden="true"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Code className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Code Compiled</div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  0ms Runtime
                </div>
              </div>
            </div>

            <div 
              className="absolute -right-3 sm:-right-6 lg:-right-8 bottom-16 sm:bottom-20 bg-[#141426]/95 backdrop-blur-xl border border-emerald-500/35 px-3.5 py-2.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.3)] items-center gap-3 hidden md:flex pointer-events-none select-none z-30" 
              style={{ animation: 'float 4s ease-in-out 1s infinite' }}
              aria-hidden="true"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Quiz Score</div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  100% Accuracy
                </div>
              </div>
            </div>

            {/* Browser Window Mockup Frame */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0a14] overflow-hidden flex flex-col relative z-20" style={{ height: 'clamp(460px, 58vw, 620px)' }}>
              {/* Browser Header */}
              <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e1a] flex items-center justify-between shrink-0">
                <div className="flex gap-2 items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-sm shadow-rose-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-sm shadow-amber-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-500/50" />
                </div>
                <div className="px-6 sm:px-12 md:px-24 py-1 rounded-lg bg-[#141424] border border-white/[0.06] text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">https://app.studysphere.ai</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />
                </div>
                <div className="w-10" />
              </div>
              
              {/* Dashboard Content — Interactive Mockup */}
              <div className="flex-1 flex min-h-0">
                {/* Sidebar Navigation */}
                <aside 
                  className="w-48 lg:w-52 border-r border-white/[0.06] bg-[#0c0c16] p-2.5 flex flex-col hidden sm:flex shrink-0 overflow-y-auto scrollbar-none relative z-20"
                  aria-label="Interactive preview sidebar"
                >
                  {/* Brand Header */}
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-2.5 py-1.5 mb-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group relative z-30 flex-shrink-0"
                    title="StudySphere AI Dashboard"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight truncate">StudySphere AI</span>
                  </Link>

                  {/* Navigation Links — All 12 items verified clickable */}
                  <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-none py-1">
                    {[
                      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
                      { name: "AI Tutor", path: "/ai", icon: MessageSquare },
                      { name: "Notes", path: "/notes", icon: FileText },
                      { name: "PDF Learning", path: "/pdf", icon: BookOpen },
                      { name: "Quiz Generator", path: "/quiz", icon: HelpCircle },
                      { name: "Flashcards", path: "/flashcards", icon: FolderLock },
                      { name: "Planner", path: "/planner", icon: Calendar },
                      { name: "Coding Practice", path: "/coding", icon: Code },
                      { name: "Cybersecurity Lab", path: "/cybersecurity", icon: ShieldAlert },
                      { name: "Resume Assistant", path: "/resume", icon: FileBadge },
                      { name: "Progress Analytics", path: "/analytics", icon: BarChart3 },
                      { name: "Admin Panel", path: "/admin", icon: Lock },
                    ].map((item, idx) => {
                      const isActive = idx === 0; // Dashboard is active in the preview
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer relative z-30 group ${
                            isActive
                              ? "bg-purple-500/20 text-white border-l-2 border-purple-400 font-semibold shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border-l-2 border-transparent"
                          }`}
                          title={`Navigate to ${item.name}`}
                        >
                          <div className={`flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${isActive ? "text-purple-300" : ""}`}>
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate whitespace-nowrap">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-3.5 md:p-4 lg:p-5 bg-[#0a0a14] flex flex-col gap-3.5 overflow-y-auto min-w-0">
                  {/* Header Row */}
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-white tracking-tight">Welcome back, Chaitanya! 👋</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your intelligent learning dashboard</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[10px] font-semibold text-amber-300">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>14-day streak</span>
                      </div>
                      <Link 
                        to="/dashboard"
                        className="px-2.5 py-1 bg-gradient-to-r from-violet-600/30 via-purple-600/30 to-fuchsia-600/30 border border-purple-500/30 hover:border-purple-500/60 rounded-lg text-[10px] font-semibold text-purple-200 transition-colors shadow-sm cursor-pointer"
                        title="Pro Plan Status"
                      >
                        Pro Plan
                      </Link>
                    </div>
                  </div>
                  
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      { value: "12", label: "Topics Completed", color: "text-purple-300", bg: "bg-purple-500/15 border-purple-500/30", icon: BookOpen, badge: "+3 this wk", path: "/analytics" },
                      { value: "48", label: "Quizzes Taken", color: "text-blue-300", bg: "bg-blue-500/15 border-blue-500/30", icon: HelpCircle, badge: "94% avg", path: "/quiz" },
                      { value: "6", label: "Projects Built", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30", icon: Code, badge: "2 active", path: "/coding" },
                      { value: "3", label: "Certificates", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30", icon: Award, badge: "Verified", path: "/dashboard" },
                    ].map((stat) => (
                      <Link
                        key={stat.label}
                        to={stat.path}
                        className="bg-[#121220] border border-white/[0.06] hover:border-purple-500/40 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] hover:bg-[#161628] block shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.bg}`}>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{stat.badge}</span>
                        </div>
                        <div className={`text-xl lg:text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.label}</div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Row — Continue Learning + Today's Goals */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                    {/* Continue Learning */}
                    <div className="flex-1 bg-[#121220] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-400" />
                            Continue Learning
                          </h4>
                          <Link to="/coding" className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">View all →</Link>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: "Data Structures & Algorithms", topic: "Module 4: Graph Traversals", pct: 65, color: "bg-gradient-to-r from-violet-500 to-purple-500", icon: Code, iconBg: "bg-purple-500/15 text-purple-400", path: "/coding" },
                            { name: "Machine Learning Fundamentals", topic: "Neural Networks & Backprop", pct: 40, color: "bg-gradient-to-r from-blue-500 to-cyan-500", icon: Cpu, iconBg: "bg-blue-500/15 text-blue-400", path: "/ai" },
                            { name: "Web Development with React", topic: "State Management & Hooks", pct: 82, color: "bg-gradient-to-r from-emerald-500 to-teal-500", icon: Globe, iconBg: "bg-emerald-500/15 text-emerald-400", path: "/notes" },
                          ].map((course) => (
                            <Link 
                              key={course.name}
                              to={course.path}
                              className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group cursor-pointer"
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${course.iconBg}`}>
                                    <course.icon className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">{course.name}</div>
                                    <div className="text-[9px] text-slate-400 truncate">{course.topic}</div>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-200 shrink-0 ml-2">{course.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.pct}%` }} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Quick Tools Action Chips */}
                      <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                        <div className="text-[10px] font-semibold text-slate-400 mb-1.5">Quick Tools</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { label: "AI Tutor", path: "/ai", icon: MessageSquare, color: "text-purple-400" },
                            { label: "Upload PDF", path: "/pdf", icon: BookOpen, color: "text-blue-400" },
                            { label: "Instant Quiz", path: "/quiz", icon: HelpCircle, color: "text-pink-400" },
                            { label: "Code Arena", path: "/coding", icon: Code, color: "text-cyan-400" }
                          ].map((q) => (
                            <Link 
                              key={q.label} 
                              to={q.path}
                              className="px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:bg-purple-500/10 hover:border-purple-500/30 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 justify-center"
                            >
                              <q.icon className={`w-3 h-3 ${q.color}`} />
                              <span className="truncate">{q.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Today's Goals */}
                    <div className="w-full lg:w-56 xl:w-60 bg-[#121220] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between shrink-0">
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Today's Goals
                          </h4>
                          <Link to="/planner" className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">Planner →</Link>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { task: "Complete AI Notes", done: true, time: "15m", path: "/notes" },
                            { task: "Take DSA Quiz", done: true, time: "20m", path: "/quiz" },
                            { task: "Practice Coding", done: false, time: "30m", path: "/coding" },
                            { task: "Read Cyber Article", done: false, time: "10m", path: "/cybersecurity" },
                          ].map((goal) => (
                            <Link 
                              key={goal.task}
                              to={goal.path}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${goal.done ? "bg-emerald-500 text-black shadow-sm shadow-emerald-500/50" : "border border-slate-600 group-hover:border-purple-400"}`}>
                                  {goal.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className={`text-xs ${goal.done ? "text-slate-400 line-through" : "text-white font-medium group-hover:text-purple-200"} truncate`}>{goal.task}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-1.5">{goal.time}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* XP Progress Card */}
                      <Link 
                        to="/analytics"
                        className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors p-1"
                        title="View XP Analytics"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">1,250 XP</div>
                            <div className="text-[10px] text-amber-400/90 font-medium">Level 8 • Scholar</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full shrink-0">+150 XP</span>
                      </Link>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-24 px-6 sm:px-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[#0a0a12]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-[#0a0a12] to-purple-500/20" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#161625]/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12 md:p-20 text-center shadow-[0_0_50px_rgba(139,92,246,0.15)]"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Learning?</h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Join thousands of students and professionals who are already learning faster and achieving more with StudySphere AI.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:scale-105"
            >
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};
