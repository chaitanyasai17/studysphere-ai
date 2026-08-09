import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  FileBadge,
  Sparkles,
  Loader2,
  Copy,
  Download,
  Info,
  CheckCircle,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Award,
  Layers,
  Search,
  BookOpen,
  ShieldAlert,
  Terminal,
  Play,
  ArrowRight,
  UserCheck,
  Plus,
  Compass,
  Send,
  Upload,
  Trash2,
  Check,
  X
} from "lucide-react";

interface PlacementStats {
  career_readiness_score: number;
  resume_score: number;
  interview_score: number;
  coding_progress: number;
  study_progress: number;
  weekly_goals: string[];
  monthly_goals: string[];
  strong_skills: string[];
  weak_skills: string[];
  recommended_actions: Array<{ task: string; module: string }>;
}

export const ResumeAssistant: React.FC = () => {
  const { addToast } = useNotifications();

  // Active Placement Hub tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "scan" | "interview" | "roadmap">("dashboard");

  // Dashboard Stats state
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Resume Scanner & ATS Analyzer states
  const [scanRole, setScanRole] = useState("Software Engineer");
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [resumeHistory, setResumeHistory] = useState<any[]>([]);

  // File uploads
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeSuccess, setResumeSuccess] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [extractLoading, setExtractLoading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("");
  const [debugReport, setDebugReport] = useState<any | null>(null);
  const [lastError, setLastError] = useState<string>("");

  // Job description matching
  const [jdType, setJdType] = useState<"paste" | "upload">("paste");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdProgress, setJdProgress] = useState(0);
  const [jdSuccess, setJdSuccess] = useState("");
  const [jdExtractLoading, setJdExtractLoading] = useState(false);

  // Interview simulator state
  const [interviewRole, setInterviewRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [length, setLength] = useState("5");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currIndex, setCurrIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [historyAnswers, setHistoryAnswers] = useState<Array<{ q: string; a: string; eval: any }>>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [finalReport, setFinalReport] = useState<any | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Career Advisor state
  const [advisorRole, setAdvisorRole] = useState("Software Engineer");
  const [advisorSkills, setAdvisorSkills] = useState("");
  const [advisorRoadmap, setAdvisorRoadmap] = useState<any | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/resume/placements/stats");
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchInterviewHistory = async () => {
    try {
      const res = await api.get("/api/resume/interview/history");
      setHistoryList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResumeHistory = async () => {
    try {
      const res = await api.get("/api/resume/history");
      setResumeHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInterviewHistory();
    fetchResumeHistory();
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historyAnswers, interviewLoading]);

  // File text extraction handler
  const downloadDebugReport = () => {
    if (!debugReport) return;
    const blob = new Blob([JSON.stringify(debugReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studysphere_ats_debug_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Debug Report", "Developer debug report downloaded successfully.", "success");
  };

  const handleUploadFile = async (file: File, type: "resume" | "jd") => {
    const formData = new FormData();
    formData.append("file", file);
    
    if (type === "resume") {
      setExtractLoading(true);
      setUploadStage("Uploading...");
      setResumeProgress(20);
      setResumeSuccess("");
      setLastError("");
      setDebugReport(null);
    } else {
      setJdExtractLoading(true);
      setJdProgress(20);
      setJdSuccess("");
    }

    let interval: any;
    let timer = 0;
    try {
      interval = setInterval(() => {
        timer += 200;
        if (type === "resume") {
          setResumeProgress(p => p < 90 ? p + 5 : p);
          if (timer >= 1200 && timer < 3000) {
            setUploadStage("Extracting Resume...");
          } else if (timer >= 3000) {
            setUploadStage("Running OCR (if needed)...");
          }
        } else {
          setJdProgress(p => p < 90 ? p + 10 : p);
        }
      }, 200);

      const res = await api.post("/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      clearInterval(interval);
      if (type === "resume") {
        setResumeProgress(100);
        setResumeText(res.data.text);
        setResumeSuccess(`Success: ${res.data.filename}`);
        setUploadStage("Completed");
        addToast("Text Extracted", "Resume parsed successfully.", "success");
      } else {
        setJdProgress(100);
        setJdText(res.data.text);
        setJdSuccess(`Success: ${res.data.filename}`);
        addToast("Text Extracted", "Job Description parsed successfully.", "success");
      }
    } catch (err: any) {
      if (interval) clearInterval(interval);
      const errMsg = err.response?.data?.message || "Failed to extract text from file.";
      addToast("Extraction Failed", errMsg, "error");
      if (type === "resume") {
        setResumeProgress(0);
        setLastError(errMsg);
        setUploadStage("Failed");
        setDebugReport({
          filename: file.name,
          size_bytes: file.size,
          content_type: file.type,
          error: errMsg,
          stage: "Extraction",
          timestamp: new Date().toISOString()
        });
      } else {
        setJdFile(null);
        setJdProgress(0);
      }
    } finally {
      if (type === "resume") setExtractLoading(false);
      else setJdExtractLoading(false);
    }
  };

  // ATS scanner trigger
  const handleScanResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      addToast("Warning", "Please upload your resume file first.", "warning");
      return;
    }

    setScanLoading(true);
    setScanResult(null);
    setUploadStage("Analyzing ATS...");
    addToast("Analyzing ATS Parameters", "AI auditor checking section scores...", "info");

    const timerInterval = setTimeout(() => {
      setUploadStage("Generating Suggestions...");
    }, 1500);

    try {
      const res = await api.post("/api/resume/ats-analysis", {
        resume_text: resumeText,
        target_role: scanRole,
        job_description_text: jdText,
        filename: resumeFile?.name || "Uploaded Resume"
      });
      clearTimeout(timerInterval);
      setUploadStage("Completed");
      setScanResult(res.data);
      addToast("Analysis Complete", `ATS score: ${res.data.ats_score}%`, "success");
      fetchStats();
      fetchResumeHistory();
    } catch (err: any) {
      clearTimeout(timerInterval);
      const errMsg = err.response?.data?.message || "Failed to process ATS audit.";
      addToast("Error", errMsg, "error");
      setLastError(errMsg);
      setUploadStage("Failed");
      setDebugReport({
        filename: resumeFile?.name || "Uploaded Resume",
        error: errMsg,
        stage: "ATS Analysis",
        timestamp: new Date().toISOString()
      });
    } finally {
      setScanLoading(false);
    }
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/resume/history/${id}`);
      addToast("Deleted", "Resume analysis report removed.", "success");
      fetchResumeHistory();
      if (scanResult?._id === id) {
        setScanResult(null);
      }
    } catch (err) {
      addToast("Failed", "Could not delete report.", "error");
    }
  };

  const exportMarkdown = (data: any) => {
    let md = `# ATS Resume Analysis Report\n\n`;
    md += `**Target Role**: ${data.role}\n`;
    md += `**Date**: ${new Date(data.created_at).toLocaleDateString()}\n`;
    md += `**Overall Score**: ${data.ats_score}/100\n`;
    md += `**Recommendation**: ${data.final_recommendation}\n\n`;
    md += `## Match Breakdown\n`;
    md += `- Job Description Match: ${data.job_match_pct}%\n`;
    md += `- Keyword Match: ${data.keyword_match_pct}%\n`;
    md += `- Skills Match: ${data.skill_match_pct}%\n`;
    md += `- Experience Match: ${data.experience_match_pct}%\n`;
    md += `- Education Match: ${data.education_match_pct}%\n\n`;
    
    md += `## Missing Keywords\n`;
    md += data.keywords?.missing?.map((k: string) => `- ${k}`).join("\n") + "\n\n";
    
    md += `## AI Recommendations\n`;
    md += `### Recommended Certifications\n`;
    md += data.ai_recommendations?.recommended_certifications?.map((c: string) => `- ${c}`).join("\n") + "\n\n";
    
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ats_report_${data.role.replace(/\s+/g, "_")}.md`;
    a.click();
  };

  const exportJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ats_report_${data.role.replace(/\s+/g, "_")}.json`;
    a.click();
  };

  // Mock Interview triggers
  const handleStartInterview = async () => {
    setInterviewLoading(true);
    setInterviewId(null);
    setHistoryAnswers([]);
    setInterviewCompleted(false);
    setFinalReport(null);
    addToast("Starting Interview", `Loading mock questions for ${interviewRole}...`, "info");

    try {
      const res = await api.post("/api/resume/interview/start", {
        role: interviewRole,
        difficulty,
        length
      });
      setInterviewId(res.data.interview_id);
      setActiveQuestion(res.data.first_question);
      setCurrIndex(0);
    } catch (err) {
      addToast("Failed", "Could not launch interview simulator.", "error");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || !interviewId || interviewLoading) return;

    const answer = answerInput;
    setAnswerInput("");
    setInterviewLoading(true);
    addToast("Evaluating Answer", "AI recruiter checking completeness...", "info");

    try {
      const res = await api.post(`/api/resume/interview/${interviewId}/answer`, {
        answer: answer
      });

      const evaluation = res.data.evaluation;
      setHistoryAnswers(prev => [...prev, {
        q: activeQuestion,
        a: answer,
        eval: evaluation
      }]);

      if (res.data.completed) {
        setInterviewCompleted(true);
        setFinalReport(res.data.report);
        addToast("Interview Completed", `XP and coins awarded! Final score: ${res.data.report.overall_score}%`, "success");
        fetchStats(); // Update Dashboard stats
        fetchInterviewHistory();
      } else {
        setActiveQuestion(res.data.next_question);
        setCurrIndex(res.data.current_index);
      }
    } catch (err) {
      addToast("Error", "Failed to submit answer.", "error");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Career advisor timeline trigger
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvisorLoading(true);
    setAdvisorRoadmap(null);
    addToast("Generating Timeline", "AI structuring weeks planning milestones...", "info");

    try {
      const res = await api.post("/api/resume/advisor/roadmap", {
        role: advisorRole,
        skills: advisorSkills
      });
      setAdvisorRoadmap(res.data);
      addToast("Advisor Roadmap Ready", "Milestones timeline compiled successfully.", "success");
      fetchStats(); // Update Dashboard stats
    } catch (err) {
      addToast("Failed", "Could not generate roadmap.", "error");
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Printable report generator
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header layout */}
      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">AI Mock Interview & Career Hub</h1>
          <p className="text-[10px] text-slate-450 mt-1">
            Simulate stateful technical interviews, evaluate resumes against ATS scorecards, and compile personalized roadmap milestones.
          </p>
        </div>
      </div>

      {/* Tabs navigation selectors */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-850 pb-2 overflow-x-auto select-none">
        {[
          { id: "dashboard", label: "Readiness Dashboard", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: "scan", label: "ATS Resume Scan", icon: <FileBadge className="w-3.5 h-3.5" /> },
          { id: "interview", label: "Mock Interview", icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: "roadmap", label: "Roadmap Planner", icon: <Compass className="w-3.5 h-3.5" /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Main split screens panels grid */}
      <div className="min-h-[60vh] overflow-y-auto">
        
        {/* TAB 1: Placement Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Stats Gauges (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-5">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Readiness Index</span>
                
                {statsLoading ? (
                  <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                ) : (
                  <div className="space-y-4 flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" className="text-slate-900" strokeWidth="2.5" stroke="currentColor" />
                        <motion.circle 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          className="text-indigo-500" 
                          strokeWidth="2.5" 
                          strokeDasharray={`${stats?.career_readiness_score || 0}, 100`}
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <span className="absolute text-lg font-black text-white">{stats?.career_readiness_score}%</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Placement Eligibility</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">Eligibility calculated from average ATS resumes and mock interview results.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bars details */}
              <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Study Progress</span>
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>Coding Challenges Progress</span>
                      <span>{stats?.coding_progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 border border-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats?.coding_progress || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>Textbook Reading Progress</span>
                      <span>{stats?.study_progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 border border-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stats?.study_progress || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Placement Targets Details (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Score breakdown metrics cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4.5 rounded-2xl border border-white/5 bg-[#12131A] shadow-lg">
                  <span className="text-[9px] font-black uppercase text-indigo-400 block mb-1.5">Resume ATS Target</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">{stats?.resume_score || 0}%</span>
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">LATEST SCORE</span>
                  </div>
                </div>
                <div className="p-4.5 rounded-2xl border border-white/5 bg-[#12131A] shadow-lg">
                  <span className="text-[9px] font-black uppercase text-indigo-400 block mb-1.5">Mock Interview Average</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">{stats?.interview_score || 0}%</span>
                    <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">EVALUATIONS AVG</span>
                  </div>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-1.5">Verified Strong Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {stats?.strong_skills.map(s => (
                      <span key={s} className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-555 hover:scale-105 transition-transform">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-450 border-b border-white/5 pb-1.5">Target Improvement Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {stats?.weak_skills.map(s => (
                      <span key={s} className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/5 text-rose-400 border border-rose-555 hover:scale-105 transition-transform">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Next Actions based on weaknesses */}
              <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Recommended Placement Tasks</span>
                <div className="space-y-2.5">
                  {stats?.recommended_actions.map((act, idx) => (
                    <div key={idx} className="p-3 bg-[#181922] border-l-2 border-indigo-500 rounded-r-xl flex items-center justify-between text-[10px] hover:bg-[#1f202b] transition-colors">
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-300 font-bold">{act.task}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg">{act.module}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ATS Resume Scanner & Analyzer */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-20rem)] pb-12">
            
            {/* Sidebar Setup Form & History log (Left 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Target Profile & Files
                </span>
                
                <form onSubmit={handleScanResume} className="space-y-4">
                  {/* Target role dropdown selection */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Target Job Role</label>
                    <select
                      value={scanRole}
                      onChange={(e) => setScanRole(e.target.value)}
                      className="w-full p-2 border rounded-xl text-[10px] bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Python Developer">Python Developer</option>
                      <option value="AI Engineer">AI Engineer</option>
                      <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                      <option value="SOC Analyst">SOC Analyst</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                    </select>
                  </div>

                  {/* Drag & Drop Resume PDF/DOCX Zone */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Upload Resume (PDF/DOCX)</label>
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          setResumeFile(file);
                          handleUploadFile(file, "resume");
                        }
                      }}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all select-none"
                      onClick={() => document.getElementById("resume-input-file")?.click()}
                    >
                      <input 
                        type="file" 
                        id="resume-input-file" 
                        accept=".pdf,.docx" 
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setResumeFile(file);
                            handleUploadFile(file, "resume");
                          }
                        }}
                      />
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Drag & Drop Resume or Browse</p>
                      <p className="text-[7px] text-slate-400 mt-0.5">Supports PDF, DOCX up to 5MB</p>
                    </div>

                    {/* Resume File Metadata Progress info */}
                    {resumeFile && (
                      <div className="p-3 border dark:border-slate-850 rounded-xl bg-slate-50/30 dark:bg-slate-950/20 space-y-2">
                        <div className="flex justify-between items-center text-[8px] font-bold text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[150px]">{resumeFile.name}</span>
                          <span>{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        {resumeProgress > 0 && (
                          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${resumeProgress}%` }} />
                          </div>
                        )}
                        {uploadStage && (
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500">
                            {(extractLoading || scanLoading) && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                            <span>Stage: <span className="text-indigo-400 font-extrabold uppercase">{uploadStage}</span></span>
                          </div>
                        )}
                        {resumeSuccess && (
                          <span className="text-[8px] text-emerald-500 font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3" /> {resumeSuccess}
                          </span>
                        )}
                        {lastError && (
                          <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-lg space-y-1.5 text-left">
                            <span className="text-[7.5px] text-red-400 font-black uppercase flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Extraction Failed
                            </span>
                            <p className="text-[8px] text-slate-300 leading-normal">{lastError}</p>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleUploadFile(resumeFile, "resume")}
                                className="px-2 py-1 bg-red-650 hover:bg-red-750 text-white rounded text-[7px] font-bold tracking-wider uppercase cursor-pointer"
                              >
                                Retry Upload
                              </button>
                              {debugReport && (
                                <button
                                  type="button"
                                  onClick={downloadDebugReport}
                                  className="px-2 py-1 bg-[#12131A] border border-white/5 hover:text-white rounded text-[7px] font-bold tracking-wider uppercase cursor-pointer text-slate-400"
                                >
                                  Download Debug Report
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Optional Job Description Match Toggle Zone */}
                  <div className="space-y-2 border-t pt-3 dark:border-slate-850">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Target Job Description (Optional)</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[8px] font-bold">
                        <button 
                          type="button"
                          onClick={() => setJdType("paste")}
                          className={`px-1.5 py-0.5 rounded ${jdType === "paste" ? "bg-white text-slate-800 shadow-sm" : "text-slate-450"}`}
                        >
                          Paste
                        </button>
                        <button 
                          type="button"
                          onClick={() => setJdType("upload")}
                          className={`px-1.5 py-0.5 rounded ${jdType === "upload" ? "bg-white text-slate-800 shadow-sm" : "text-slate-450"}`}
                        >
                          PDF/DOCX
                        </button>
                      </div>
                    </div>

                    {jdType === "paste" ? (
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste target job requirements details here..."
                        className="w-full h-20 p-2 text-[10px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
                      />
                    ) : (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            setJdFile(file);
                            handleUploadFile(file, "jd");
                          }
                        }}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all select-none"
                        onClick={() => document.getElementById("jd-input-file")?.click()}
                      >
                        <input 
                          type="file" 
                          id="jd-input-file" 
                          accept=".pdf,.docx" 
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setJdFile(file);
                              handleUploadFile(file, "jd");
                            }
                          }}
                        />
                        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Drag & Drop JD or Browse</p>
                      </div>
                    )}

                    {jdFile && jdType === "upload" && (
                      <div className="p-3 border dark:border-slate-850 rounded-xl bg-slate-50/30 dark:bg-slate-950/20 space-y-1.5">
                        <div className="flex justify-between items-center text-[8px] font-bold text-slate-600">
                          <span className="truncate max-w-[150px]">{jdFile.name}</span>
                          <span>{(jdFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        {jdProgress > 0 && (
                          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${jdProgress}%` }} />
                          </div>
                        )}
                        {jdSuccess && (
                          <span className="text-[8px] text-emerald-500 font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3" /> {jdSuccess}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submission Audit Trigger button */}
                  <button
                    type="submit"
                    disabled={scanLoading || extractLoading || !resumeText}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {scanLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing ATS Compatibility...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Run ATS Analyzer</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Resume History List */}
              <div className="p-5 border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm space-y-3 max-h-[300px] overflow-y-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">Resume History logs</span>
                {resumeHistory.length === 0 ? (
                  <p className="text-[8px] text-slate-450 text-center py-4">No previous reports found.</p>
                ) : (
                  <div className="space-y-2">
                    {resumeHistory.map((item) => (
                      <div 
                        key={item._id}
                        onClick={() => setScanResult(item)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-[9px] ${
                          scanResult?._id === item._id 
                            ? "border-indigo-500 bg-indigo-500/5" 
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 border-slate-200 dark:border-slate-850"
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[80%]">
                          <strong className="text-slate-800 dark:text-slate-200 block truncate">{item.filename}</strong>
                          <span className="text-slate-450 block">{item.role} • {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">{item.ats_score}%</span>
                          <button 
                            onClick={(e) => handleDeleteReport(item._id, e)}
                            className="p-1 hover:bg-rose-100 rounded text-rose-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Audit Results Dashboard Panels (Right 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {scanLoading ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-3 border dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm p-6">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <h4 className="text-xs font-bold text-slate-850 dark:text-white">AI Auditor Evaluating Scorecard</h4>
                  <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">Parsing bullet action verbs, evaluating keyword matching thresholds, and compiling ReportLab visual assets...</p>
                </div>
              ) : scanResult ? (
                <div className="space-y-6">
                  
                  {/* Top Exporter Buttons */}
                  <div className="flex justify-between items-center p-4 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
                    <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Report Exporters</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => exportJSON(scanResult)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> JSON
                      </button>
                      <button 
                        onClick={() => exportMarkdown(scanResult)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Markdown
                      </button>
                      <button 
                        onClick={handlePrintReport}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> PDF Report
                      </button>
                    </div>
                  </div>

                  {/* ATS Dashboard Score cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Overall Score */}
                    <div className="p-5 border border-white/5 bg-[#12131A] rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">ATS Score</span>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" className="text-slate-900" strokeWidth="2.5" stroke="currentColor" />
                          <motion.circle 
                            cx="18" 
                            cy="18" 
                            r="15.915" 
                            fill="none" 
                            className={
                              (scanResult.ats_score || 0) < 50
                                ? "text-rose-500"
                                : (scanResult.ats_score || 0) < 75
                                ? "text-amber-500"
                                : "text-emerald-500"
                            } 
                            strokeWidth="2.5" 
                            strokeDasharray={`${scanResult.ats_score || 0}, 100`}
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <span className={`absolute text-sm font-black ${
                          (scanResult.ats_score || 0) < 50
                            ? "text-rose-400"
                            : (scanResult.ats_score || 0) < 75
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}>{scanResult.ats_score}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-555 px-2 py-0.5 rounded-lg">{scanResult.final_recommendation || "Good"}</span>
                    </div>

                    {/* Progress bars metrics list */}
                    <div className="p-6 border border-white/5 bg-[#12131A] rounded-3xl shadow-xl md:col-span-3 space-y-4">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Dashboard Metrics</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {[
                          { label: "Keyword Match", val: scanResult.keyword_match_pct || 75 },
                          { label: "Formatting Score", val: scanResult.formatting_score || 80 },
                          { label: "Skills Score", val: scanResult.skill_match_pct || 82 },
                          { label: "Grammar Score", val: scanResult.grammar_score || 85 }
                        ].map((m) => (
                          <div key={m.label} className="space-y-1 text-[9px]">
                            <div className="flex justify-between font-bold text-slate-400 mb-1">
                              <span>{m.label}</span>
                              <span>{m.val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${m.val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Job Description Match Comparison Section */}
                  {jdText && (
                    <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">Job Description Comparison</span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: "Overall Match", val: scanResult.job_match_pct, color: "bg-indigo-600" },
                          { label: "Keyword Overlap", val: scanResult.keyword_match_pct, color: "bg-emerald-600" },
                          { label: "Skill Score", val: scanResult.skill_match_pct, color: "bg-amber-500" },
                          { label: "Experience Match", val: scanResult.experience_match_pct, color: "bg-sky-500" },
                          { label: "Education Match", val: scanResult.education_match_pct, color: "bg-purple-500" }
                        ].map((item) => (
                          <div key={item.label} className="p-3 border rounded-2xl text-center space-y-1.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase block">{item.label}</span>
                            <span className="text-sm font-black text-slate-850 dark:text-white block">{item.val || 0}%</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${item.val || 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {scanResult.match_suggestions && scanResult.match_suggestions.length > 0 && (
                        <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-500/10 rounded-2xl text-[9px] space-y-1.5 text-slate-600 leading-relaxed">
                          <strong className="text-indigo-650 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Comparison Suggestions</strong>
                          <ul className="list-disc pl-4 space-y-1">
                            {scanResult.match_suggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Keyword analysis chip panels */}
                  <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">Target Keywords Analysis</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[9px]">
                      {/* Matched Keywords */}
                      <div className="space-y-2 p-3 border rounded-2xl bg-slate-50/20">
                        <span className="font-extrabold text-emerald-600 uppercase tracking-widest block">Matched Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywords?.matched?.map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 font-medium">{k}</span>
                          )) || <span className="text-slate-400">None detected.</span>}
                        </div>
                      </div>
                      
                      {/* Missing Keywords */}
                      <div className="space-y-2 p-3 border rounded-2xl bg-slate-50/20">
                        <span className="font-extrabold text-rose-500 uppercase tracking-widest block">Missing Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywords?.missing?.map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/15 text-rose-500 font-medium">{k}</span>
                          )) || <span className="text-slate-400">None detected.</span>}
                        </div>
                      </div>

                      {/* Recommended Keywords */}
                      <div className="space-y-2 p-3 border rounded-2xl bg-slate-50/20">
                        <span className="font-extrabold text-amber-500 uppercase tracking-widest block">Recommended Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.keywords?.recommended?.map((k: string) => (
                            <span key={k} className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-655 font-medium">{k}</span>
                          )) || <span className="text-slate-400">None detected.</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resume Section Analyzer checklist */}
                  <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">ATS Resume Section Checklist</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px]">
                      {scanResult.sections && Object.keys(scanResult.sections).map((key) => {
                        const sec = scanResult.sections[key];
                        return (
                          <div key={key} className="p-3 border rounded-2xl flex gap-3 items-start bg-slate-50/10 hover:bg-slate-50/30 transition-all animate-fadeIn">
                            <div className="mt-0.5">
                              {sec.found ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <strong className="text-slate-850 dark:text-slate-200 capitalize">{key.replace("_", " ")}</strong>
                              <p className="text-slate-450 leading-relaxed text-[8.5px]">{sec.suggestions}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skills Categorized panels */}
                  <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">Skills Categorized Distribution</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                      {scanResult.skills_categorized && Object.keys(scanResult.skills_categorized).map((category) => (
                        <div key={category} className="p-3 border rounded-2xl bg-slate-50/10 space-y-2">
                          <strong className="text-indigo-650 block capitalize">{category}</strong>
                          <div className="flex flex-wrap gap-1">
                            {scanResult.skills_categorized[category].map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border text-slate-550 border-slate-200/60 dark:border-slate-800 text-[8px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Analyzer cards */}
                  <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">Resume Projects Strength Review</span>
                    <div className="space-y-4">
                      {scanResult.projects?.map((proj: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-2xl space-y-3 bg-slate-50/10">
                          <div className="flex justify-between items-center border-b pb-2 border-slate-150">
                            <h6 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{proj.title}</h6>
                            <div className="flex gap-2 text-[8px] font-bold">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Impact Score: {proj.impact_score}%</span>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">Strength: {proj.strength_score}%</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[9px] text-slate-600 leading-relaxed">
                            <div>
                              <strong className="block text-slate-800">Technology Stack</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {proj.tech_stack.map((t: string) => (
                                  <span key={t} className="px-1.5 py-0.5 rounded bg-white border text-[8px]">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <strong className="block text-slate-800">Recruiter Impression</strong>
                              <span className="italic mt-0.5 block">"{proj.recruiter_impression}"</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px] pt-1">
                            <div className="p-2 border rounded-xl bg-white/60">
                              <strong className="block text-slate-700">Action Verbs & Quantified Results</strong>
                              <span className="block mt-0.5">Verbs: {proj.action_verbs}</span>
                              <span className="block text-emerald-600 font-medium">Metrics: {proj.quantified_results}</span>
                            </div>
                            <div className="p-2 border rounded-xl bg-white/60">
                              <strong className="block text-slate-700">Improvement Suggestions</strong>
                              <ul className="list-disc pl-4 space-y-0.5 mt-0.5 text-[8.5px]">
                                {proj.suggestions.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Improvements Tab Revisions */}
                  <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">AI-Powered Resume Improvements</span>
                    <div className="space-y-4 text-[9px]">
                      {scanResult.improvements && Object.keys(scanResult.improvements).map((section) => (
                        <div key={section} className="p-3 border rounded-2xl bg-indigo-50/10 border-indigo-500/5 space-y-1.5">
                          <strong className="text-indigo-650 block capitalize">{section.replace("_", " ")}</strong>
                          <pre className="whitespace-pre-wrap font-mono text-[8px] bg-slate-950 text-slate-200 p-3 rounded-xl overflow-x-auto leading-relaxed border dark:border-slate-850">
                            {scanResult.improvements[section]}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations & Learning pathways */}
                  {scanResult.ai_recommendations && (
                    <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">AI-Generated Career Recommendations</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9px] leading-relaxed">
                        
                        <div className="p-3 border rounded-2xl bg-slate-50/15 space-y-2">
                          <strong className="text-emerald-600 block">Certifications & Missing Skills</strong>
                          <ul className="list-disc pl-4 space-y-1">
                            {scanResult.ai_recommendations.top_missing_skills.map((s: string) => (
                              <li key={s}>Skill: {s}</li>
                            ))}
                            {scanResult.ai_recommendations.recommended_certifications.map((c: string) => (
                              <li key={c}>Cert: {c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 border rounded-2xl bg-slate-50/15 space-y-2">
                          <strong className="text-indigo-650 block">Recommended Practice Projects</strong>
                          <ul className="list-disc pl-4 space-y-1">
                            {scanResult.ai_recommendations.recommended_projects.map((p: string) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 border rounded-2xl bg-slate-50/15 space-y-2 md:col-span-2">
                          <strong className="text-slate-800 dark:text-slate-200 block">Interview Prep & Learning Roadmap</strong>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <span className="font-bold text-slate-600">Top Interview Questions to prepare:</span>
                              <ul className="list-disc pl-4 space-y-1 mt-1 text-[8.5px]">
                                {scanResult.ai_recommendations.interview_preparation.map((q: string, i: number) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-bold text-slate-600">Action Plan Roadmap:</span>
                              <ul className="list-disc pl-4 space-y-1 mt-1 text-[8.5px]">
                                {scanResult.ai_recommendations.learning_roadmap.map((r: string, i: number) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* History Trends chart SVG */}
                  {resumeHistory.length > 0 && (
                    <div className="p-5 border dark:border-slate-850 bg-white dark:bg-slate-900 rounded-3xl shadow-sm space-y-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2">ATS Score History Trend</span>
                      <div className="w-full h-32 flex items-end gap-3 pt-4">
                        {resumeHistory.slice().reverse().map((item, idx) => (
                          <div key={item._id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end select-none">
                            <span className="text-[8px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded">{item.ats_score}%</span>
                            <div 
                              className="w-full bg-indigo-500/20 hover:bg-indigo-500 rounded-t-md transition-all duration-300 cursor-pointer"
                              style={{ height: `${item.ats_score}%` }}
                              onClick={() => setScanResult(item)}
                            />
                            <span className="text-[7.5px] text-slate-400 truncate w-full text-center">{new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-4 max-w-xs mx-auto border dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl shadow-sm p-6">
                  <FileBadge className="w-10 h-10 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-white">Professional AI Resume Analyzer</h4>
                    <p className="text-[10px] text-slate-455 mt-1 leading-relaxed">Upload your resume in PDF/DOCX format, paste the target role, and optional job description requirements to generate a recruiter compatibility audit.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: Mock Interview Simulator */}

        {/* TAB 3: Mock Interview Simulator */}
        {activeTab === "interview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-20rem)] overflow-hidden">
            
            {/* Setup Settings & Session logs (Left 4 cols) */}
            <div className="lg:col-span-4 h-full flex flex-col border border-slate-200/50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-3 border-b border-slate-150 bg-slate-50/20 dark:bg-slate-950/10 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interview Panel</span>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-4 select-none">
                
                {/* Simulator Options forms */}
                <div className="p-4 border bg-white rounded-2xl space-y-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Target Placement Role</label>
                    <select
                      value={interviewRole}
                      onChange={(e) => setInterviewRole(e.target.value)}
                      className="w-full p-2 border rounded-lg text-[10px] outline-none"
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                      <option value="SOC Analyst">SOC Analyst</option>
                      <option value="Data Analyst">Data Analyst</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Questions</label>
                      <select
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full p-2 border rounded-lg text-[10px] outline-none"
                      >
                        <option value="5">5 Qs</option>
                        <option value="10">10 Qs</option>
                        <option value="15">15 Qs</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full p-2 border rounded-lg text-[10px] outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleStartInterview}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Play className="w-3 h-3" /> Spin Up AI Simulator
                  </button>
                </div>

                {/* Past sessions history logs list */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase text-slate-450 block px-1">Session Log History</span>
                  {historyList.map(h => (
                    <div key={h._id} className="p-3 border rounded-xl bg-white flex items-center justify-between text-[10px]">
                      <div>
                        <h6 className="font-bold text-slate-700">{h.role}</h6>
                        <span className="text-[8px] text-slate-400 block mt-0.5">{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-mono text-indigo-650 bg-indigo-500/5 px-2 py-0.5 rounded font-black">{h.report?.overall_score || 0}%</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Interview chatbot console (Right 8 cols) */}
            <div className="lg:col-span-8 h-full flex flex-col border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-3 border-b border-slate-150 bg-slate-50/20 dark:bg-slate-950/10 flex-shrink-0 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-500" /> Mock Recruitment Console
                </span>
                {interviewId && !interviewCompleted && (
                  <span className="text-[9px] font-mono text-indigo-650 bg-indigo-500/10 px-2 py-0.5 rounded">Question {currIndex + 1} of {length}</span>
                )}
              </div>

              {/* Stateful Simulator workspace */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {interviewId ? (
                  <>                    {/* Chat history logs */}
                    {historyAnswers.map((h, idx) => (
                      <div key={idx} className="space-y-4">
                        {/* Question */}
                        <div className="flex gap-3 max-w-[85%] mr-auto items-start">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-white/5 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-black select-none">Q</div>
                          <div className="p-3 bg-[#181922] border border-white/5 rounded-2xl text-[10.5px] text-slate-200 font-semibold leading-relaxed select-text">{h.q}</div>
                        </div>
                        {/* Answer */}
                        <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse items-start">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-black select-none">ME</div>
                          <div className="p-3 bg-indigo-650 text-white rounded-2xl text-[10.5px] whitespace-pre-wrap select-text leading-relaxed shadow-md shadow-indigo-600/5">{h.a}</div>
                        </div>
                        {/* Recruiter AI feedback */}
                        <div className="p-4 border border-white/5 rounded-2xl bg-[#12131A] space-y-3 max-w-[90%] mr-auto ml-11 shadow-inner select-text">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-[8px] font-black text-indigo-400 uppercase flex items-center gap-1.5 select-none"><Sparkles className="w-3 h-3" /> Recruiter Evaluation</span>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg">Accuracy Score: {h.eval.score}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[9.5px] text-slate-400">
                            <div><strong className="text-slate-300">Communication:</strong> {h.eval.communication}</div>
                            <div><strong className="text-slate-300">Confidence:</strong> {h.eval.confidence}</div>
                          </div>
                          <p className="text-[9.5px] text-slate-400"><strong className="text-slate-300">Improvement Tip:</strong> {h.eval.suggestions}</p>
                          <div className="p-3 border border-white/5 rounded-xl bg-slate-950/60 text-[9px] text-slate-450 leading-relaxed italic">
                            <strong className="text-slate-300 block not-italic mb-1 font-bold">Better Alternative answer sample:</strong>
                            "{h.eval.better_sample_answer}"
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Completion Report Card */}
                    {interviewCompleted && finalReport && (
                      <div id="print-interview-report" className="p-6 border border-white/5 rounded-3xl bg-[#12131A] space-y-6 select-text">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Placement Assessment Report</h4>
                            <span className="text-[9px] text-slate-500 block mt-0.5">StudySphere AI Recruiter Evaluations Platform</span>
                          </div>
                          <button
                            onClick={handlePrintReport}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                          >
                            <Download className="w-3 h-3" /> Export PDF / Print
                          </button>
                        </div>

                        {/* Overall readiness metric */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                          <div className="p-4 border border-white/5 rounded-2xl bg-[#181922]">
                            <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Overall score</span>
                            <span className="text-base font-black text-indigo-400">{finalReport.overall_score}%</span>
                          </div>
                          <div className="p-4 border border-white/5 rounded-2xl bg-[#181922]">
                            <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Technical skills</span>
                            <span className="text-base font-black text-white">{finalReport.technical_score}%</span>
                          </div>
                          <div className="p-4 border border-white/5 rounded-2xl bg-[#181922]">
                            <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">HR & Behavioural</span>
                            <span className="text-base font-black text-white">{finalReport.hr_score}%</span>
                          </div>
                          <div className="p-4 border border-white/5 rounded-2xl bg-[#181922]">
                            <span className="text-[8px] font-black uppercase text-slate-500 block mb-1">Communication</span>
                            <span className="text-base font-black text-white">{finalReport.communication_score}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px]">
                          <div className="space-y-2">
                            <h5 className="font-black uppercase tracking-wider text-emerald-400 border-b border-white/5 pb-1">Core Strengths</h5>
                            <ul className="list-disc pl-4 text-slate-400 space-y-1.5">
                              {finalReport.strengths.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h5 className="font-black uppercase tracking-wider text-rose-450 border-b border-white/5 pb-1">Core Weaknesses & Gaps</h5>
                            <ul className="list-disc pl-4 text-slate-400 space-y-1.5">
                              {finalReport.weaknesses.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-5 space-y-4 text-[10px]">
                          <h5 className="font-black uppercase tracking-wider text-indigo-400">Placement Preparation Actions checklist</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4.5 border border-white/5 rounded-2xl bg-[#181922] space-y-2">
                              <span className="font-bold text-slate-300 block mb-1">Recommended Projects</span>
                              <div className="flex flex-wrap gap-1.5">
                                {finalReport.recommended_projects.map((p: string) => (
                                  <span key={p} className="text-[8px] px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400 font-bold font-mono">{p}</span>
                                ))}
                              </div>
                            </div>
                            <div className="p-4.5 border border-white/5 rounded-2xl bg-[#181922] space-y-2">
                              <span className="font-bold text-slate-300 block mb-1">Suggested Certifications</span>
                              <div className="flex flex-wrap gap-1.5">
                                {finalReport.recommended_certifications.map((c: string) => (
                                  <span key={c} className="text-[8px] px-2 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400 font-bold font-mono">{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active Question Panel */}
                    {!interviewCompleted && (
                      <div className="space-y-4 select-none">
                        <div className="flex gap-3 max-w-[85%] mr-auto items-start">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-white/5 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-black animate-pulse">Q</div>
                          <div className="p-3 bg-[#181922] border border-white/5 rounded-2xl text-[10.5px] text-slate-200 font-bold leading-relaxed">{activeQuestion}</div>
                        </div>

                        {/* Text Answer input */}
                        <form onSubmit={handleSubmitAnswer} className="flex gap-2 border-t border-white/5 pt-4">
                          <input
                            type="text"
                            placeholder="Type your interview answer..."
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            disabled={interviewLoading}
                            className="flex-grow px-4 py-2.5 rounded-xl border border-white/5 bg-[#181922] text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
                            required
                          />
                          <button
                            type="submit"
                            disabled={!answerInput.trim() || interviewLoading}
                            className="p-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-xs mx-auto">
                    <UserCheck className="w-10 h-10 text-slate-300" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white">AI Mock Interview Simulator</h4>
                      <p className="text-[10px] text-slate-450 mt-1">Configure your target role and difficulty on the left panel, and click spin up simulator to start mock queries.</p>
                    </div>
                  </div>
                )}
                {interviewLoading && (
                  <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 flex items-center justify-center animate-spin">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatScrollRef} />
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: Career Advisor roadmap planner */}
        {activeTab === "roadmap" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-20rem)] overflow-hidden">
            
            {/* Target goals settings (Left 5 cols) */}
            <div className="lg:col-span-5 h-full flex flex-col border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-3 border-b border-slate-150 bg-slate-50/20 dark:bg-slate-950/10 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" /> Career Goal Settings
                </span>
              </div>
              <form onSubmit={handleGenerateRoadmap} className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Target Career Role</label>
                  <select
                    value={advisorRole}
                    onChange={(e) => setAdvisorRole(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs outline-none"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Python Developer">Python Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                    <option value="SOC Analyst">SOC Analyst</option>
                    <option value="Data Analyst">Data Analyst</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Current Skills Set</label>
                  <textarea
                    value={advisorSkills}
                    onChange={(e) => setAdvisorSkills(e.target.value)}
                    placeholder="Python, Flask database blueprints, basic html layout..."
                    className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={advisorLoading || !advisorSkills.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {advisorLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Compiling Learning Paths...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Roadmap</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Compiled Learning timeline (Right 7 cols) */}
            <div className="lg:col-span-7 h-full flex flex-col border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/40 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-3 border-b border-slate-150 bg-slate-50/20 dark:bg-slate-950/10 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" /> Learning Roadmap Timeline
                </span>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {advisorLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-[10px] text-slate-400">AI Recruiter mapping milestones timeline...</p>
                  </div>
                ) : advisorRoadmap ? (
                  <div className="space-y-6">                    {/* Roadmap steps */}
                    <div className="space-y-4 select-none">
                      <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Step-by-Step Learning Timeline</h5>
                      <div className="space-y-4 pl-3 border-l-2 border-indigo-500/30">
                        {advisorRoadmap.learning_roadmap.map((step: any, idx: number) => (
                          <div key={idx} className="relative pl-5 space-y-1">
                            <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-indigo-550 border-2 border-slate-950 animate-pulse" />
                            <h6 className="text-[11px] font-black text-white">{step.step}</h6>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{step.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div className="p-4 border border-white/5 rounded-2xl bg-slate-950/60 space-y-2">
                        <span className="font-bold text-slate-300 block mb-1">Recommended Courses</span>
                        <div className="space-y-1.5">
                          {advisorRoadmap.recommended_courses.map((c: string) => (
                            <div key={c} className="text-[9.5px] text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-500" /> {c}</div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 border border-white/5 rounded-2xl bg-slate-950/60 space-y-2">
                        <span className="font-bold text-slate-300 block mb-1">Recommended Certs</span>
                        <div className="space-y-1.5">
                          {advisorRoadmap.recommended_certifications.map((c: string) => (
                            <div key={c} className="text-[9.5px] text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-500" /> {c}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Milestones checklists */}
                    <div className="space-y-2 select-none">
                      <h5 className="text-[10px] font-bold uppercase text-slate-450">Monthly Milestones Checklist</h5>
                      <div className="space-y-2">
                        {advisorRoadmap.milestones.map((m: any, idx: number) => (
                          <div key={idx} className="p-2.5 border rounded-xl bg-slate-50/10 flex items-center justify-between text-[10px]">
                            <div>
                              <strong className="text-slate-800">{m.title}</strong>
                              <span className="text-[9px] text-slate-450 block mt-0.5">{m.desc}</span>
                            </div>
                            <Award className="w-4 h-4 text-indigo-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-xs mx-auto">
                    <Compass className="w-10 h-10 text-slate-300" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white">Career advisor roadmap</h4>
                      <p className="text-[10px] text-slate-455 mt-1">Configure target career role preferences to generate weekly study roadmaps and milestone checklists.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
