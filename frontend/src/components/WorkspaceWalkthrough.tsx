import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Code,
  Terminal,
  Play,
  CheckCircle,
  Sparkles,
  Shield,
  Loader2,
  FileText,
  Lock
} from "lucide-react";

type TabId = "tutor" | "pdf" | "compiler" | "cyber";

interface TabItem {
  id: TabId;
  label: string;
  badge: string;
  icon: React.ReactNode;
  color: string;
  accentGlow: string;
}

const TABS: TabItem[] = [
  {
    id: "tutor",
    label: "AI Tutor",
    badge: "General Tutoring Mode",
    icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
    color: "from-purple-500/20 to-indigo-500/20",
    accentGlow: "rgba(168,85,247,0.25)"
  },
  {
    id: "pdf",
    label: "PDF Reader",
    badge: "Textbook RAG Analyst",
    icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    color: "from-sky-500/20 to-indigo-500/20",
    accentGlow: "rgba(56,189,248,0.25)"
  },
  {
    id: "compiler",
    label: "Compiler",
    badge: "Python 3.12 Sandbox",
    icon: <Code className="w-4 h-4 text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/20",
    accentGlow: "rgba(52,211,153,0.25)"
  },
  {
    id: "cyber",
    label: "Cyber Labs",
    badge: "Stateful Linux Lab",
    icon: <Terminal className="w-4 h-4 text-rose-400" />,
    color: "from-rose-500/20 to-red-500/20",
    accentGlow: "rgba(251,113,133,0.25)"
  }
];

export const WorkspaceWalkthrough: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("tutor");
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Sub-animation states for each tab
  const [tutorStep, setTutorStep] = useState<"thinking" | "answering">("thinking");
  const [tutorText, setTutorText] = useState("");
  const [compilerStatus, setCompilerStatus] = useState<"idle" | "running" | "done">("idle");
  const [pdfHighlight, setPdfHighlight] = useState(false);
  const [cyberProgress, setCyberProgress] = useState(0);
  const [cyberLogs, setCyberLogs] = useState<string[]>([]);

  // Auto-cycle timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = TABS.findIndex((t) => t.id === prev);
        const nextIndex = (currentIndex + 1) % TABS.length;
        return TABS[nextIndex].id;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Tab change trigger for sub-animations
  useEffect(() => {
    if (activeTab === "tutor") {
      setTutorStep("thinking");
      setTutorText("");
      const timer1 = setTimeout(() => setTutorStep("answering"), 1200);
      const timer2 = setTimeout(() => {
        setTutorText(
          "Caching stores precomputed results in key-value memory, replacing O(N) dataset scans with O(1) constant lookup time."
        );
      }, 1400);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    if (activeTab === "pdf") {
      setPdfHighlight(false);
      const timer = setTimeout(() => setPdfHighlight(true), 600);
      return () => clearTimeout(timer);
    }

    if (activeTab === "compiler") {
      setCompilerStatus("idle");
      const timer1 = setTimeout(() => setCompilerStatus("running"), 800);
      const timer2 = setTimeout(() => setCompilerStatus("done"), 2200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    if (activeTab === "cyber") {
      setCyberProgress(0);
      setCyberLogs([]);
      
      const t1 = setTimeout(() => {
        setCyberProgress(35);
        setCyberLogs(["[+] Inspecting Layer 7 HTTP/2 Packet Frames..."]);
      }, 600);

      const t2 = setTimeout(() => {
        setCyberProgress(75);
        setCyberLogs((prev) => [...prev, "[+] Verifying AES-256 GCM Cryptographic Handshake..."]);
      }, 1600);

      const t3 = setTimeout(() => {
        setCyberProgress(100);
        setCyberLogs((prev) => [...prev, "[✔] Anomaly Audit Passed: 0 Vulns Found. Lab Complete!"]);
      }, 2600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [activeTab]);

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
      {/* Background ambient lighting & grid glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[900px] h-[450px] bg-gradient-to-r from-purple-600/10 via-indigo-500/10 to-sky-500/10 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse-slow" />
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
          <Sparkles className="w-3.5 h-3.5" /> Interactive Feature Demo
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          Workspace Walkthrough
        </h2>
        <p className="text-xs sm:text-sm lg:text-[15px] text-[#C5CAD3] leading-relaxed">
          Toggle between tabs to experience StudySphere AI’s dynamic modules in real time.
        </p>
      </motion.div>

      {/* Tab Controls Bar */}
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

      {/* Workspace Preview Showcase Card */}
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
        {/* Card outer glow frame */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Top glowing edge highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          {/* Card Window Layout */}
          <div className="rounded-2xl border border-slate-855 bg-[#0D0E15] overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col justify-between text-left relative">
            
            {/* Mock Header Bar */}
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

            {/* Tab Workspace View Switcher */}
            <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between relative overflow-hidden">
              <AnimatePresence mode="wait">
                
                {/* 1. AI TUTOR DEMO */}
                {activeTab === "tutor" && (
                  <motion.div
                    key="tutor"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      {/* User Prompt Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-md px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium shadow-lg flex items-center gap-2">
                          <span>Explain Big-O caching optimization</span>
                          <span className="text-[9px] opacity-75 font-mono">ME</span>
                        </div>
                      </div>

                      {/* AI Tutor Response Area */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-200">StudySphere AI Tutor</span>
                        </div>

                        {tutorStep === "thinking" ? (
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs flex items-center gap-2.5"
                          >
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            <span className="font-mono text-[11px]">AI is analyzing data structures...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-3"
                          >
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                              {tutorText}
                            </p>

                            {/* Code snippet block */}
                            <div className="p-3.5 rounded-xl bg-[#07080D] border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 relative group">
                              <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-850 pb-1.5 mb-2">
                                <span>python_cache.py</span>
                                <span className="text-emerald-400">O(1) Hash Map</span>
                              </div>
                              <p className="text-slate-500"># Caching lookup replaces linear O(N) scans</p>
                              <p><span className="text-purple-400">cache</span> = &#123;&#125;</p>
                              <p><span className="text-indigo-400">def</span> <span className="text-sky-300">get_user</span>(user_id):</p>
                              <p className="pl-4"><span className="text-indigo-400">if</span> user_id <span className="text-indigo-400">not in</span> cache:</p>
                              <p className="pl-8">cache[user_id] = fetch_from_db(user_id) <span className="text-slate-500"># O(N) -&gt; O(1)</span></p>
                              <p className="pl-4"><span className="text-indigo-400">return</span> cache[user_id]</p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Ribbon */}
                    <div className="pt-3 border-t border-slate-855 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Retrieval Augmented Generation Active
                      </span>
                      <span className="text-slate-500">Gemini 1.5 Flash • 0.24s</span>
                    </div>
                  </motion.div>
                )}

                {/* 2. PDF READER DEMO */}
                {activeTab === "pdf" && (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full"
                  >
                    {/* Left Sidebar Chapter Index */}
                    <div className="hidden md:block md:col-span-4 p-3 rounded-xl bg-[#08090F] border border-slate-855 space-y-2 font-mono text-[10px]">
                      <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-sky-400" /> software_eng.pdf
                      </div>
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold flex items-center justify-between">
                        <span>Ch 2: Testing Scope</span>
                        <span className="text-[8px] bg-sky-400/20 text-sky-300 px-1.5 py-0.5 rounded">Pg 14</span>
                      </div>
                      <div className="p-2 text-slate-500 hover:text-slate-300">Ch 3: Integration Specs</div>
                      <div className="p-2 text-slate-500 hover:text-slate-300">Ch 4: Deployment Audits</div>
                    </div>

                    {/* Main PDF Document View */}
                    <div className="col-span-12 md:col-span-8 space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-200">Chapter 2.4: Boundary Value Analysis</h4>
                          <span className="text-[9px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                            Citation Index #14
                          </span>
                        </div>

                        {/* Document Paragraph with Animated Highlight */}
                        <div className="p-3.5 rounded-xl bg-[#08090F] border border-slate-855 text-xs text-slate-300 leading-relaxed relative overflow-hidden">
                          {pdfHighlight && (
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{ duration: 1.5, ease: "easeInOut" }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent pointer-events-none"
                            />
                          )}
                          <p>
                            <span className={pdfHighlight ? "bg-sky-500/20 text-sky-200 px-1 rounded transition-colors duration-500" : ""}>
                              Boundary Value Analysis (BVA) focuses on testing inputs at extreme edge limits (e.g. 0, N-1, N).
                            </span>{" "}
                            Software defects occur overwhelmingly at boundary thresholds rather than center partition values.
                          </p>
                        </div>

                        {/* Floating AI Insight Callout */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="p-3 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2.5"
                        >
                          <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <span className="font-bold text-[11px] text-sky-300 block">AI Summary & Citation</span>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              "98% match on Page 14. BVA checks lower and upper boundary conditions to catch off-by-one errors."
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Context Index Loaded
                        </span>
                        <span>240 Pages Parsed</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. COMPILER DEMO */}
                {activeTab === "compiler" && (
                  <motion.div
                    key="compiler"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-3 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-3">
                      {/* Code Editor Header */}
                      <div className="flex items-center justify-between bg-[#08090F] px-3 py-2 rounded-xl border border-slate-855 font-mono text-[10px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-emerald-400" /> binary_search.py
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Python 3.12
                          </span>
                          <button 
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              compilerStatus === "running"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                            }`}
                          >
                            {compilerStatus === "running" ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Running...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Run Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Code Editor Lines */}
                      <div className="p-3 rounded-xl bg-[#06070B] border border-slate-855 font-mono text-[11px] text-slate-300 leading-relaxed">
                        <div className="flex gap-3 text-slate-600">
                          <div className="select-none text-right">
                            <p>1</p><p>2</p><p>3</p><p>4</p>
                          </div>
                          <div>
                            <p><span className="text-indigo-400">def</span> <span className="text-emerald-300">binary_search</span>(arr, target):</p>
                            <p className="pl-4">low, high = <span className="text-amber-300">0</span>, <span className="text-indigo-400">len</span>(arr) - <span className="text-amber-300">1</span></p>
                            <p className="pl-4"><span className="text-indigo-400">while</span> low &lt;= high:</p>
                            <p className="pl-8">mid = (low + high) // <span className="text-amber-300">2</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Execution Terminal Output Panel */}
                      <div className="p-3 rounded-xl bg-[#040508] border border-slate-855 font-mono text-[10px] space-y-1.5">
                        <div className="text-slate-500 flex justify-between">
                          <span>Output Terminal</span>
                          <span className="text-emerald-400">Status: 200 OK</span>
                        </div>

                        {compilerStatus === "running" ? (
                          <div className="text-amber-400 animate-pulse flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> Compiling & executing python3 main.py...
                          </div>
                        ) : compilerStatus === "done" ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                            <p className="text-emerald-400">&gt;&gt;&gt; Target 42 found at Index 4 (Execution time: 1.2ms)</p>
                            <div className="flex gap-2 pt-1">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                Time: O(log N)
                              </span>
                              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                                Space: O(1)
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <p className="text-slate-600">Click 'Run Code' to compile and analyze runtime metrics...</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Sandboxed Compiler Active
                      </span>
                      <span>Python, C++, Java, JS, SQL</span>
                    </div>
                  </motion.div>
                )}

                {/* 4. CYBER LABS DEMO */}
                {activeTab === "cyber" && (
                  <motion.div
                    key="cyber"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-3 flex flex-col justify-between h-full font-mono"
                  >
                    <div className="space-y-3">
                      {/* Terminal Top Bar */}
                      <div className="flex items-center justify-between bg-[#08090F] px-3 py-2 rounded-xl border border-slate-855 text-[10px]">
                        <span className="text-rose-400 font-bold flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" /> student@studysphere-sec-lab:~#
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                          Stateful Linux Node
                        </span>
                      </div>

                      {/* Progress Bar Visualizer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Network Packet Audit Progress</span>
                          <span className="text-rose-400 font-bold">{cyberProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-855">
                          <motion.div
                            className="h-full bg-gradient-to-r from-rose-500 to-red-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${cyberProgress}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      </div>

                      {/* Terminal Console Logs */}
                      <div className="p-3.5 rounded-xl bg-[#05060A] border border-slate-855 text-[10.5px] space-y-1.5 min-h-[110px]">
                        <p className="text-slate-400">$ ./packet_analyzer --scan --interface eth0</p>
                        {cyberLogs.map((log, idx) => (
                          <motion.p
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={
                              log.includes("✔") ? "text-emerald-400 font-bold" : "text-rose-300"
                            }
                          >
                            {log}
                          </motion.p>
                        ))}
                      </div>

                      {/* Security Badges */}
                      <div className="flex flex-wrap gap-2 text-[9.5px]">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-rose-400" /> AES-256 Encrypted
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-400" /> Layer 7 Firewall
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          ⚡ +50 XP Awarded
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Cyber Simulation Environment Operational
                      </span>
                      <span>Safe Educational Sandbox</span>
                    </div>
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
