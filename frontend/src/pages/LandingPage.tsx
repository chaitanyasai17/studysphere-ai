import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  BookOpen,
  MessageSquare,
  FileBadge,
  TrendingUp,
  Calendar,
  CheckCircle,
  HelpCircle,
  Code,
  Shield,
  Briefcase,
  Play,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  ChevronDown,
  Globe
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [demoTab, setDemoTab] = useState<"tutor" | "pdf" | "compiler" | "cyber">("tutor");
  const [statsCounters, setStatsCounters] = useState({
    students: 12000,
    chats: 450000,
    notes: 420000,
    pdfs: 32000,
    interviews: 8500,
    challenges: 64000
  });

  const formatValue = (num: number, label: string) => {
    if (label === "Mock Interviews") {
      return (num / 1000).toFixed(1) + "K+";
    }
    return (num / 1000).toFixed(0) + "K+";
  };

  // Simple stats incremental counter simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setStatsCounters(prev => ({
        students: prev.students + Math.floor(Math.random() * 2),
        chats: prev.chats + Math.floor(Math.random() * 5),
        notes: prev.notes + Math.floor(Math.random() * 3),
        pdfs: prev.pdfs + Math.floor(Math.random() * 2),
        interviews: prev.interviews + Math.floor(Math.random() * 1),
        challenges: prev.challenges + Math.floor(Math.random() * 4)
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Interactive AI Tutor",
      desc: "Simulate private teaching circles. Get custom explanations, structured tables, and learning Style-adapted summaries.",
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      color: "from-indigo-500/10 to-purple-500/10"
    },
    {
      title: "Docu-Sense PDF Learning",
      desc: "Read textbooks and index chapter outlines. Chat with document scopes to locate relevant citation pages instantly.",
      icon: <BookOpen className="w-5 h-5 text-sky-500" />,
      color: "from-sky-500/10 to-indigo-500/10"
    },
    {
      title: "Active Flashcard Decks",
      desc: "Flip cards and test recollection thresholds. Harness spaced repetition techniques to build long-term memory milestones.",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: "from-amber-500/10 to-orange-500/10"
    },
    {
      title: "Complexity Code IDE",
      desc: "Compile Python, SQL, C++, Java, and JS in a sandboxed execution terminal with Big-O runtime analyses.",
      icon: <Code className="w-5 h-5 text-emerald-500" />,
      color: "from-emerald-500/10 to-teal-500/10"
    },
    {
      title: "Stateful CLI Cyber Lab",
      desc: "Explore Layer 1-7 packets simulator, symmetric AES ciphers, and parameterized mitigations sandboxes.",
      icon: <Terminal className="w-5 h-5 text-rose-500" />,
      color: "from-rose-500/10 to-red-500/10"
    },
    {
      title: "SaaS Study Planner",
      desc: "Schedule study slots, organize coursework tasks, and log levels milestones on a visual tracking heatmap.",
      icon: <Calendar className="w-5 h-5 text-purple-500" />,
      color: "from-purple-500/10 to-indigo-500/10"
    },
    {
      title: "ATS Resume Analyzer",
      desc: "Upload PDF/DOCX files, run recruiter-focused keyword analyses, and copy optimized sections rewrites.",
      icon: <Briefcase className="w-5 h-5 text-cyan-500" />,
      color: "from-cyan-500/10 to-blue-500/10"
    },
    {
      title: "Mock Interview Recruiter",
      desc: "Practice realistic tech and HR questions. Get evaluated on technical depth and communication scores.",
      icon: <FileBadge className="w-5 h-5 text-violet-500" />,
      color: "from-violet-500/10 to-purple-500/10"
    }
  ];

  const timelineSteps = [
    { num: "01", title: "Initialize Profile", desc: "Define your department interests, semester targets, and preferred AI learning style model." },
    { num: "02", title: "Upload Notes & PDFs", desc: "Import lecture markdown notes or complete textbook chapters into your workspace." },
    { num: "03", title: "Learn with AI Tutor", desc: "Interact with the retrieval-augmented tutor to explain concepts with simple examples." },
    { num: "04", title: "Evaluate & Practice", desc: "Generate timed quizzes, code algorithm scripts, and solve security labs challenges." },
    { num: "05", title: "Track Progress Streaks", desc: "Accumulate coins and level points as you complete daily study planner targets." },
    { num: "06", title: "Unlock Career Hub", desc: "Build ATS-scored resumes, clear mock interviews, and land top placement rounds." }
  ];

  const whySphereItems = [
    { title: "Personalized Study Paths", desc: "Unlike generic tutors, StudySphere parses your syllabus goals to structure custom timelines." },
    { title: "Sandboxed Execution", desc: "Practice coding and execute cybersecurity commands securely within isolated mock nodes." },
    { title: "Direct ATS Evaluation", desc: "Upload docx/pdf drafts directly to match targeted corporate job role descriptions." },
    { title: "Gamified Streaking Heatmaps", desc: "Duolingo-inspired streaks motivate daily review habits and active retrieval routines." }
  ];

  const faqItems = [
    { q: "What is StudySphere AI?", a: "StudySphere AI is an integrated, intelligence-powered student dashboard hosting note editors, PDF context parsers, coding compilers, network terminals, and career training hubs." },
    { q: "Does the Coding Playground actually run code?", a: "Yes! Our backend features sandboxed compilers for Python, Java, C++, JS, and SQL that print outputs and run complexity metrics checks." },
    { q: "How does the ATS Resume Analyzer process uploads?", a: "We parse PDF and Word files using PyMuPDF and python-docx, extracting technical skill categories and matching keywords against target roles." },
    { q: "Can I use my own OpenAI API credentials?", a: "Absolutely. In your account settings page, you can configure your custom OpenAI keys to bypass standard platform daily token limits." },
    { q: "Is my personal textbook data secure?", a: "Yes. All uploaded PDF chapters are indexed locally and isolated per user session under strict JWT authentication security parameters." }
  ];

  return (
    <>
      <div className="space-y-[140px] py-[100px] overflow-hidden antialiased subpixel-antialiased text-rendering-optimizeLegibility max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1100px] mx-auto pt-[90px] min-h-[70vh] flex flex-col items-center justify-center text-center relative select-none">
        {/* Animated glowing mesh gradient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] blur-blob bg-indigo-500/10 dark:bg-indigo-500/5 animate-pulse-slow pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-full border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-widest mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Learning Workspace
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.1] text-white animate-fade-in max-w-[850px] mx-auto mb-4"
        >
          Learn Smarter. Code Faster.<br />
          <span className="bg-gradient-to-r from-indigo-650 via-purple-500 to-sky-400 bg-clip-text text-transparent">
            Get Placement Ready with AI.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-[700px] mx-auto text-sm sm:text-base lg:text-[18px] text-[#C7CBD4] leading-[1.7] mb-9"
        >
          StudySphere AI merges Notion-like notes editors, textbook RAG queries, timed test engines, interactive coding sandboxes, and career preparation tools into one cohesive, gamified workspace.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 z-10 relative mb-12"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto h-[56px] py-[18px] px-[34px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] shadow-lg shadow-indigo-600/30 text-base font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto h-[56px] py-[18px] px-[34px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-[16px] text-base font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-indigo-500" />
            <span>Explore Demo</span>
          </a>
        </motion.div>

        {/* Interactive mock UI preview dashboard panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-5xl mx-auto z-10 relative"
        >
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md p-2 shadow-2xl">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-inner flex flex-col h-[45vh] max-h-[420px] min-h-[350px]">
              {/* Mock browser header */}
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="px-8 py-0.5 rounded bg-white dark:bg-slate-900 border text-[9px] text-slate-400 font-mono">
                  app.studysphere.ai/dashboard
                </div>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </div>
              
              {/* Mock Dashboard Layout */}
              <div className="flex-grow grid grid-cols-12 text-left h-full">
                <div className="col-span-3 border-r dark:border-slate-900 bg-slate-50/50 dark:bg-slate-955/20 p-4 space-y-4">
                  <div className="w-20 h-4 bg-indigo-500/10 rounded-full" />
                  <div className="space-y-2">
                    <div className="w-full h-6 bg-indigo-600 text-white rounded-lg px-2 flex items-center text-[9px] font-bold">📚 Study Center</div>
                    <div className="w-full h-6 rounded-lg px-2 flex items-center text-[9px] text-slate-400">💻 Compiler IDE</div>
                    <div className="w-full h-6 rounded-lg px-2 flex items-center text-[9px] text-slate-400">🛡️ Defensive Labs</div>
                    <div className="w-full h-6 rounded-lg px-2 flex items-center text-[9px] text-slate-400">💼 Placements Hub</div>
                  </div>
                </div>
                <div className="col-span-9 p-6 space-y-4 overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">Welcome back, John!</h4>
                      <p className="text-[9px] text-slate-455 mt-0.5">Your study streak is active. Keep learning to earn 🪙 15 coins today.</p>
                    </div>
                    <div className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/15 text-[8px] font-bold rounded-lg flex items-center gap-1">
                      🪙 145 Coins
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-xl bg-slate-50/20 text-center space-y-1">
                      <span className="text-[8px] text-slate-400 block font-bold">XP Level</span>
                      <strong className="text-sm text-slate-850 dark:text-white block">Level 12</strong>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: "70%" }} />
                      </div>
                    </div>
                    <div className="p-3 border rounded-xl bg-slate-50/20 text-center space-y-1">
                      <span className="text-[8px] text-slate-400 block font-bold">Study Streak</span>
                      <strong className="text-sm text-slate-855 dark:text-white block">🔥 7 Days</strong>
                      <span className="text-[7px] text-emerald-500 font-extrabold block">Daily goal met!</span>
                    </div>
                    <div className="p-3 border rounded-xl bg-indigo-500/5 border-indigo-500/10 text-center space-y-1">
                      <span className="text-[8px] text-indigo-500 block font-bold">Readiness Index</span>
                      <strong className="text-sm text-indigo-650 block">88%</strong>
                      <span className="text-[7px] text-slate-455 block">Resume target: 90%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Trusted By logos section */}
      <section className="max-w-[1440px] mx-auto px-6 text-center space-y-5">
        <span className="text-[14px] font-medium text-[#9EA6B4] uppercase tracking-widest">Empowering Scholars From Elite Engineering Institutes</span>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-85 select-none">
          {["Stanford", "Berkeley", "MIT", "CMU", "IIT", "BITS Pilani"].map(uni => (
            <span key={uni} className="text-sm sm:text-base font-medium tracking-tight text-[#BFC6D5] font-mono">{uni}</span>
          ))}
        </div>
      </section>

      {/* 3. Statistics Section */}
      <section className="max-w-[1100px] mx-auto px-6 py-12 border-y border-slate-200/50 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 text-center select-none w-full max-w-[1100px] mx-auto items-center">
          {[
            { label: "Active Students", key: "students", color: "text-[#8B5CF6]" },
            { label: "AI Tutor Chats", key: "chats", color: "text-purple-500" },
            { label: "Notes Created", key: "notes", color: "text-indigo-400" },
            { label: "PDF Uploaded", key: "pdfs", color: "text-sky-400" },
            { label: "Mock Interviews", key: "interviews", color: "text-pink-500" },
            { label: "Coding Challenges", key: "challenges", color: "text-teal-400" }
          ].map((stat, i) => {
            const displayVal = formatValue(statsCounters[stat.key as keyof typeof statsCounters], stat.label);
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center justify-center p-6 border border-white/5 bg-[#12131A] rounded-[20px] shadow-md hover:border-indigo-500/20 transition-all gap-2 w-full h-full min-h-[120px]"
              >
                <h4 className={`text-2xl lg:text-[28px] font-bold ${stat.color} leading-none tracking-tight`}>
                  {displayVal}
                </h4>
                <p className="text-[11px] sm:text-[12px] font-medium text-[#B8C1D1] tracking-[0.12em] uppercase text-center leading-snug">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="max-w-[1440px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Engineered for Academic Careers</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">Everything a student needs to accelerate studying, code algorithms, and pass technical interviews.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between group hover:border-indigo-500/20"
            >
              <div>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-base sm:text-[18px] font-semibold mb-1.5 text-[#F5F5F7] leading-snug">{f.title}</h3>
                <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">{f.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase text-indigo-400 group-hover:translate-x-1 transition-transform cursor-pointer">
                <span>Try Feature</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. Screenshots Showcase Slider mockup */}
      <section className="max-w-[1440px] mx-auto px-6 space-y-12 text-center">
        <div className="space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Workspace Walkthrough</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625] max-w-2xl mx-auto">Toggle between tabs to preview major StudySphere modules directly in action.</p>
        </div>

        <div className="flex justify-center gap-2 border-b dark:border-slate-900 pb-2 max-w-md mx-auto">
          {[
            { id: "tutor", label: "AI Tutor" },
            { id: "pdf", label: "PDF Reader" },
            { id: "compiler", label: "Compiler" },
            { id: "cyber", label: "Cyber Labs" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setDemoTab(t.id as any)}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                demoTab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Simulated UI screenshot panel */}
        <div className="max-w-4xl mx-auto rounded-3xl border dark:border-slate-850 p-2 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="rounded-2xl border dark:border-slate-900 bg-white dark:bg-slate-950 overflow-hidden h-72 flex flex-col">
            {demoTab === "tutor" && (
              <div className="p-6 text-left flex flex-col h-full justify-between">
                <div className="space-y-2">
                  <div className="px-3 py-1 rounded-full bg-slate-50 border w-max text-[8px] font-extrabold uppercase text-slate-400">General tutoring mode</div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Explain: Big-O Caching optimization</h4>
                  <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[8px] rounded-xl leading-relaxed border dark:border-slate-800">
                    {`# Caching lookup improves linear scans from O(N) to O(1) space complexity.
seen_items = {}
def check_cache(item_id):
    return seen_items.get(item_id, None)`}
                  </pre>
                </div>
                <div className="w-full bg-slate-50 border rounded-xl p-2 flex justify-between items-center text-[9px] text-slate-400">
                  <span>Enter prompt details...</span>
                  <ArrowRight className="w-4 h-4 text-indigo-650" />
                </div>
              </div>
            )}
            {demoTab === "pdf" && (
              <div className="p-6 text-left flex flex-col h-full justify-between">
                <div className="space-y-2">
                  <div className="px-3 py-1 rounded-full bg-slate-50 border w-max text-[8px] font-extrabold uppercase text-slate-400">Textbook RAG Analyst</div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Ask: What is boundary value testing?</h4>
                  <div className="p-3 border rounded-xl bg-indigo-5/10 border-indigo-500/5 text-[9px] text-slate-605 leading-relaxed">
                    "According to Page 12 of the uploaded software_engineering.pdf, Boundary Value Testing is a software testing technique in which test cases are designed to include values at the boundary limits..."
                  </div>
                </div>
                <div className="w-full h-8 bg-slate-50 border rounded-xl flex items-center px-3 text-[9px] text-indigo-650 font-bold">
                  PDF outline matches found: Page 12 (92% overlap)
                </div>
              </div>
            )}
            {demoTab === "compiler" && (
              <div className="p-6 text-left flex flex-col h-full justify-between font-mono">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">Python Compilation output logs</h4>
                  <div className="p-3 bg-slate-950 text-slate-205 rounded-xl text-[8.5px] leading-relaxed border dark:border-slate-800">
                    {`>>> Run code checks
Output: [1, 2, 3, 5, 8]
Complexity Analysis:
- Time Complexity: O(N) linear scan
- Space Complexity: O(1) in-place filter`}
                  </div>
                </div>
                <div className="text-[8px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Compiler sandbox ready
                </div>
              </div>
            )}
            {demoTab === "cyber" && (
              <div className="p-6 text-left flex flex-col h-full justify-between font-mono">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">Stateful Linux Terminal session</h4>
                  <div className="p-3 bg-slate-950 text-slate-205 rounded-xl text-[8.5px] leading-relaxed border dark:border-slate-800">
                    {`student@studysphere:~$ ls
flag.txt    lessons/
student@studysphere:~$ cat flag.txt
FLAG{PERSISTENT_LINUX_Blueprints_SEEDED}`}
                  </div>
                </div>
                <div className="text-[8px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Stateful flag matched (+50 XP awarded!)
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. How it works Timeline */}
      <section id="timeline" className="max-w-[1440px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">The 6-Step Learning Timeline</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">Go from raw course materials to verified mock interview placement ready.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="p-8 border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm space-y-3 relative">
              <div className="text-3xl font-extrabold text-[#8B5CF6] font-mono">{step.num}</div>
              <h5 className="text-base sm:text-[18px] font-semibold text-[#F5F5F7] leading-snug">{step.title}</h5>
              <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Why choose StudySphere comparison section */}
      <section id="why-choose" className="max-w-[1440px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Why Choose StudySphere?</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">How we stand out against traditional single-purpose textbook reading apps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {whySphereItems.map((item, idx) => (
            <div key={idx} className="p-8 border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-2">
                <CheckCircle className="w-4.5 h-4.5 text-indigo-650" />
              </div>
              <h4 className="text-base sm:text-[18px] font-semibold text-[#F5F5F7] leading-snug">{item.title}</h4>
              <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="max-w-[1440px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Placement Success Stories</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">Read reviews from engineering students who cracked job rounds using our interview simulator.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "StudySphere's stateful Linux labs and Caesars Cipher Cryptography labs helped me clear my SOC Analyst entry rounds easily. The XP gamification is extremely addictive!", author: "Sonia G., Cybersecurity Intern", college: "VJTI Mumbai" },
            { quote: "The resume uploader extracts keywords so cleanly. I matched my CV against target software jobs, updated missing stacks, and got shortlisted at Google!", author: "Arjun K., Software Engineer", college: "IIT Madras" },
            { quote: "Cracked my Frontend Developer interview at Amazon! The Mock Interview simulator evaluated my answers on complexity and accuracy, giving me absolute confidence.", author: "Prisha M., SDE intern", college: "BITS Pilani" }
          ].map((t, idx) => (
            <div key={idx} className="p-8 border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm space-y-4">
              <p className="text-sm sm:text-[15px] text-[#C5CAD3] italic leading-[1.625]">"{t.quote}"</p>
              <div className="border-t pt-3 border-slate-200/50 dark:border-slate-800/60">
                <strong className="text-base sm:text-[18px] font-semibold text-[#F5F5F7] block">{t.author}</strong>
                <span className="text-xs sm:text-[13px] font-medium text-[#9EA6B4] block mt-0.5">{t.college}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQ Accordion Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Frequently Asked Questions</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">Got questions about StudySphere? We have answers.</p>
        </div>

        <div className="border border-slate-200/50 dark:border-slate-800/60 rounded-3xl bg-white dark:bg-slate-900/20 overflow-hidden divide-y dark:divide-slate-800">
          {faqItems.map((item, idx) => {
            const isOpen = activeFAQ === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => setActiveFAQ(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-slate-800 dark:text-slate-200 outline-none"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625] border-t dark:border-slate-800/40">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9.5. Pricing Section */}
      <section id="pricing" className="max-w-[1100px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight">Simple, Transparent Pricing</h2>
          <p className="text-sm sm:text-[15px] text-[#C5CAD3] leading-[1.625]">Choose the perfect tier to supercharge your academic prep.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Free Tier */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 border border-white/5 bg-[#12131A] rounded-[20px] shadow-xl flex flex-col justify-between h-[450px] relative overflow-hidden"
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Free Basic</span>
              <h3 className="text-3xl font-extrabold text-white">$0</h3>
              <p className="text-xs text-slate-400">Essential tools for individual study revision.</p>
              <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-[#C5CAD3]">
                <div className="flex items-center gap-2">✓ 3 PDF textbook uploads</div>
                <div className="flex items-center gap-2">✓ 20 daily AI Tutor questions</div>
                <div className="flex items-center gap-2">✓ Markdown Notes Editor</div>
                <div className="flex items-center gap-2">✓ Basic Coding compiler</div>
              </div>
            </div>
            <Link to="/register" className="w-full h-11 bg-white/10 hover:bg-white/20 text-white rounded-[16px] text-xs font-bold transition-all flex items-center justify-center cursor-pointer">
              Get Started Free
            </Link>
          </motion.div>

          {/* Pro Tier (Center card slightly larger, gradient border, glassmorphism) */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.03 }}
            className="p-8 border-2 border-indigo-505 bg-indigo-950/20 backdrop-blur-md rounded-[20px] shadow-2xl flex flex-col justify-between h-[480px] relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[8px] font-extrabold uppercase tracking-widest">
              Most Popular
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pro Scholar</span>
              <h3 className="text-3xl font-extrabold text-white">$9<span className="text-xs text-slate-450">/mo</span></h3>
              <p className="text-xs text-slate-350">Supercharge studying with advanced agent execution environments.</p>
              <div className="border-t border-indigo-900/40 pt-4 space-y-2 text-xs text-indigo-100">
                <div className="flex items-center gap-2 text-indigo-300">✓ Unlimited PDF uploader</div>
                <div className="flex items-center gap-2">✓ Infinite AI Tutor chats</div>
                <div className="flex items-center gap-2">✓ Fully featured compiler & debugger</div>
                <div className="flex items-center gap-2">✓ Pinned Notes & recent logs</div>
                <div className="flex items-center gap-2">✓ Full Cybersecurity network simulator</div>
              </div>
            </div>
            <Link to="/register" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] text-xs font-bold transition-all flex items-center justify-center shadow-lg shadow-indigo-650/20 cursor-pointer">
              Upgrade to Pro
            </Link>
          </motion.div>

          {/* Scholar Tier */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            className="p-8 border border-white/5 bg-[#12131A] rounded-[20px] shadow-xl flex flex-col justify-between h-[450px] relative overflow-hidden"
          >
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Scholar</span>
              <h3 className="text-3xl font-extrabold text-white">Custom</h3>
              <p className="text-xs text-slate-400">Tailored plans for departments and universities.</p>
              <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-[#C5CAD3]">
                <div className="flex items-center gap-2">✓ Admin panel analytics integration</div>
                <div className="flex items-center gap-2">✓ Multi-user seat allocations</div>
                <div className="flex items-center gap-2">✓ Custom API key configurations</div>
                <div className="flex items-center gap-2">✓ Premium placement support packages</div>
              </div>
            </div>
            <a href="mailto:admin@studysphere.ai" className="w-full h-11 bg-white/10 hover:bg-white/20 text-white rounded-[16px] text-xs font-bold transition-all flex items-center justify-center cursor-pointer">
              Contact Sales
            </a>
          </motion.div>
        </div>
      </section>

      {/* 10. CTA Box Section */}
      <section className="max-w-[1100px] mx-auto px-6 w-full">
        <div className="p-12 sm:p-16 rounded-[20px] bg-indigo-950 relative overflow-hidden text-center space-y-6 shadow-2xl border border-indigo-900">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/20 filter blur-[80px]" />
          
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight z-10 relative">Ready to Accelerate Your Placement Readiness?</h2>
          <p className="max-w-xl mx-auto text-sm sm:text-[15px] text-indigo-200/70 leading-relaxed z-10 relative">
            Join thousands of college scholars leveraging automated agents to study smarter and land top engineering jobs.
          </p>
          <div className="pt-4 z-10 relative">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white hover:bg-slate-100 text-indigo-950 rounded-[16px] text-xs font-bold tracking-tight shadow-lg shadow-white/10 active:scale-95 transition-all inline-block"
            >
              Get Started Free Now
            </Link>
          </div>
        </div>
      </section>

      </div>

      {/* Footer Section */}
      <footer className="border-t border-white/5 bg-[#0B0B12] pt-16 pb-8 text-xs select-none mt-12 w-full">
        <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-[#A5A8B2]">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-sm text-white tracking-tight">StudySphere AI</span>
            </div>
            <p className="text-[11px] leading-relaxed max-w-xs text-slate-455">
              The ultimate college workspace to accelerate studying, compile logic models, pass security audits, and optimize resumes.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350">Product</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing Plans</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350">Resources</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="https://github.com" className="hover:text-indigo-400 transition-colors">GitHub Repository</a></li>
              <li><a href="https://linkedin.com" className="hover:text-indigo-400 transition-colors">LinkedIn Portal</a></li>
              <li><a href="#timeline" className="hover:text-indigo-400 transition-colors">Timeline</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350">Company</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Sign Up</Link></li>
              <li><a href="mailto:admin@studysphere.ai" className="hover:text-indigo-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-550 text-[10px]">
          <div>&copy; {new Date().getFullYear()} StudySphere AI. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
};
