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
  Globe
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
            className="relative rounded-2xl border border-white/[0.06] bg-[#161625] shadow-2xl p-2 max-w-5xl mx-auto"
          >
            {/* Floating Badges */}
            <div className="absolute -left-12 top-20 bg-[#1a1a2e] border border-white/[0.06] p-4 rounded-xl shadow-xl items-center gap-3 hidden md:flex" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Code className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Code Compiled</div>
                <div className="text-sm font-bold text-white">0ms Runtime</div>
              </div>
            </div>

            <div className="absolute -right-10 bottom-32 bg-[#1a1a2e] border border-white/[0.06] p-4 rounded-xl shadow-xl items-center gap-3 hidden md:flex" style={{ animation: 'float 4s ease-in-out 1s infinite' }}>
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Quiz Score</div>
                <div className="text-sm font-bold text-white">100% Accuracy</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-[#0a0a12] overflow-hidden flex flex-col" style={{ height: 'clamp(400px, 55vw, 620px)' }}>
              {/* Browser Header */}
              <div className="px-4 py-3 border-b border-white/[0.04] bg-[#0f0f1a] flex items-center gap-4 shrink-0">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-8 sm:px-16 md:px-32 py-1.5 rounded-md bg-[#161625] border border-white/[0.04] text-xs text-slate-500 font-mono flex items-center gap-2">
                    <Globe className="w-3 h-3" /> app.studysphere.ai
                  </div>
                </div>
              </div>
              
              {/* Dashboard Content — Real Mockup */}
              <div className="flex-1 flex min-h-0">
                {/* Sidebar */}
                <div className="w-52 lg:w-60 border-r border-white/[0.04] bg-[#0f0f1a] p-3 flex-col gap-0.5 hidden sm:flex shrink-0 overflow-y-auto">
                  <div className="flex items-center gap-2 px-3 py-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">StudySphere AI</span>
                  </div>
                  {[
                    { label: "Dashboard", icon: TrendingUp, active: true },
                    { label: "AI Tutor", icon: MessageSquare },
                    { label: "Notes", icon: FileText },
                    { label: "PDF Learning", icon: BookOpen },
                    { label: "Quiz Generator", icon: HelpCircle },
                    { label: "Coding", icon: Code },
                    { label: "Cybersecurity", icon: Shield },
                    { label: "Resume", icon: FileBadge },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        item.active
                          ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-6 bg-[#0a0a12] flex flex-col gap-4 overflow-y-auto min-w-0">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white">Welcome back, Chaitanya! 👋</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Your learning progress at a glance</p>
                    </div>
                    <div className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-violet-600/20 to-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-300 hidden md:block">
                      Pro Plan
                    </div>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { value: "12", label: "Topics Completed", color: "text-purple-400", bg: "bg-purple-500/10" },
                      { value: "48", label: "Quizzes Taken", color: "text-blue-400", bg: "bg-blue-500/10" },
                      { value: "6", label: "Projects Built", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                      { value: "3", label: "Certificates", color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-[#161625] border border-white/[0.04] rounded-xl p-3 md:p-4"
                      >
                        <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] md:text-xs text-slate-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Row — Continue Learning + Today's Goals */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                    {/* Continue Learning */}
                    <div className="flex-1 bg-[#161625] border border-white/[0.04] rounded-xl p-4 flex flex-col min-w-0">
                      <h4 className="text-xs font-semibold text-white mb-3">Continue Learning</h4>
                      <div className="space-y-3 flex-1">
                        {[
                          { name: "Data Structures & Algorithms", pct: 65, color: "bg-purple-500" },
                          { name: "Machine Learning Fundamentals", pct: 40, color: "bg-blue-500" },
                          { name: "Web Development with React", pct: 82, color: "bg-emerald-500" },
                        ].map((course) => (
                          <div key={course.name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] md:text-xs text-slate-300 truncate mr-2">{course.name}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">{course.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                              <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Quick Access */}
                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <div className="text-[10px] text-slate-500 mb-2">Quick Access</div>
                        <div className="flex flex-wrap gap-1.5">
                          {["AI Tutor", "Upload PDF", "Generate Quiz", "Coding"].map((q) => (
                            <span key={q} className="px-2 py-1 bg-white/[0.04] border border-white/[0.04] rounded-md text-[10px] text-slate-400">{q}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Today's Goals */}
                    <div className="w-full lg:w-56 xl:w-64 bg-[#161625] border border-white/[0.04] rounded-xl p-4 flex flex-col shrink-0">
                      <h4 className="text-xs font-semibold text-white mb-3">Today's Goals</h4>
                      <div className="space-y-2 flex-1">
                        {[
                          { task: "Complete AI Notes", done: true },
                          { task: "Take DSA Quiz", done: true },
                          { task: "Practice Coding", done: false },
                          { task: "Read Cybersecurity Article", done: false },
                        ].map((goal) => (
                          <div key={goal.task} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${goal.done ? "bg-emerald-500/20 border-emerald-500" : "border-slate-600"}`}>
                              {goal.done && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                            </div>
                            <span className={`text-[10px] md:text-xs ${goal.done ? "text-slate-500 line-through" : "text-slate-300"}`}>{goal.task}</span>
                          </div>
                        ))}
                      </div>
                      {/* XP Badge */}
                      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">1,250 XP</div>
                          <div className="text-[10px] text-slate-500">Level 8</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
