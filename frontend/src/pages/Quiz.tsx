import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Clock,
  Award,
  History,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCcw,
  LayoutDashboard,
  Target
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizData {
  _id: string;
  subject: string;
  difficulty: string;
  type: string;
  questions: Question[];
}

interface LeaderboardItem {
  user_id: string;
  name: string;
  total_score: number;
  quizzes_taken: number;
}

interface HistoryItem {
  _id: string;
  subject: string;
  difficulty: string;
  type: string;
  score: number;
  total_questions: number;
  time_taken: number;
  created_at: string;
}

const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number; color?: string }> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = "stroke-purple-500"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90 select-none">
      <circle
        className="stroke-white/[0.06]"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={`${color} transition-all duration-1000 ease-out`}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};

export const Quiz: React.FC = () => {
  const { addToast } = useNotifications();
  
  // Wizard settings state
  const [subject, setSubject] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("medium");
  const [quizType, setQuizType] = useState("mcq"); // mcq, tf, blanks
  const [count, setCount] = useState(5);

  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizState, setQuizState] = useState<"setup" | "playing" | "results">("setup");
  
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Confetti trigger
  const [showConfetti, setShowConfetti] = useState(false);
  
  // History & Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"quiz" | "history" | "leaderboard">("quiz");

  const timerRef = useRef<any | null>(null);
  const quizStartTimeRef = useRef<number>(0);

  const loadHistoryAndLeaderboard = async () => {
    try {
      const [histRes, leadRes] = await Promise.all([
        api.get("/api/quiz/history"),
        api.get("/api/quiz/leaderboard")
      ]);
      setHistory(histRes.data);
      setLeaderboard(leadRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistoryAndLeaderboard();
  }, [activeTab]);

  // Timer loop for active playing state
  useEffect(() => {
    if (quizState === "playing") {
      setTimer(0);
      quizStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [quizState]);

  useEffect(() => {
    if (quizState === "results") {
      const details = getScoreDetails();
      if (details.pct >= 70) {
        setShowConfetti(true);
        const t = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, [quizState]);

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/quiz/generate", {
        subject,
        difficulty,
        count,
        type: quizType
      });
      setActiveQuiz(res.data);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizState("playing");
      addToast("Quiz Ready", `Answering timed quiz: ${subject}`, "success");
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message || "AI Quiz generation failed. Please try again.";
      addToast("Quiz Failed", errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: option
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submitting) return;
    setSubmitting(true);

    // Compute raw score locally
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        score += 1;
      }
    });

    const timeSpent = Math.round((Date.now() - quizStartTimeRef.current) / 1000);

    try {
      await api.post(`/api/quiz/submit/${activeQuiz._id}`, {
        score,
        time_taken: timeSpent
      });
      addToast("Quiz Submitted", "Score calculated and saved.", "success");
      setQuizState("results");
    } catch (e) {
      addToast("Error", "Could not submit answers.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreDetails = () => {
    if (!activeQuiz) return { score: 0, total: 0, pct: 0 };
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        score += 1;
      }
    });
    return {
      score,
      total: activeQuiz.questions.length,
      pct: Math.round((score / activeQuiz.questions.length) * 100)
    };
  };

  const scoreDetails = getScoreDetails();

  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      
      {/* Header Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Quiz Generator</h1>
            <HelpCircle className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 mt-1">Create personalized quizzes from any topic or document</p>
        </div>
        
        {quizState === "setup" && (
          <div className="flex bg-[#0f0f1a] rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === "quiz" ? "bg-[#161625] text-white shadow-sm border border-white/[0.06]" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Play className="w-4 h-4" /> Practice
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === "history" ? "bg-[#161625] text-white shadow-sm border border-white/[0.06]" : "text-slate-400 hover:text-slate-200"}`}
            >
              <History className="w-4 h-4" /> History
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === "leaderboard" ? "bg-[#161625] text-white shadow-sm border border-white/[0.06]" : "text-slate-400 hover:text-slate-200"}`}
            >
              <TrendingUp className="w-4 h-4" /> Leaderboard
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* SETUP TAB */}
        {activeTab === "quiz" && quizState === "setup" && (
          <motion.div key="setup" {...pageTransition} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 lg:p-8 space-y-8 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Custom Quiz</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Topic or Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Data Structures, Modern History"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#0f0f1a] text-white placeholder:text-slate-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Difficulty</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 capitalize
                          ${difficulty === level 
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                            : 'bg-[#0f0f1a] border-white/[0.06] text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.02]'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          level === 'easy' ? 'bg-emerald-500' : 
                          level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Question Types</label>
                    <div className="relative">
                      <select
                        value={quizType}
                        onChange={(e) => setQuizType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-[#0f0f1a] text-white appearance-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="tf">True / False</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Number of Questions</label>
                    <div className="flex bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-1">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => setCount(num)}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            count === num
                              ? 'bg-[#161625] text-white shadow-sm border border-white/[0.06]'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                disabled={loading || !subject.trim()}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>

            {/* Visual card details for quiz */}
            <div className="bg-[#1a1a2e] border border-purple-500/20 rounded-2xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-600/20 blur-[80px] group-hover:bg-purple-600/30 transition-all duration-500" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-cyan-600/20 blur-[80px] group-hover:bg-cyan-600/30 transition-all duration-500" />
              
              <div className="space-y-4 z-10 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5" />
                  Active Evaluator
                </div>
                <h4 className="text-2xl font-bold text-white leading-tight">AI-Powered Assessment Engine</h4>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                  Our AI generates contextually accurate questions based on your input to test your knowledge deeply and prepare you for actual exams.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-8 z-10 relative">
                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0a0a12]/50 backdrop-blur-md flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">MCQ Weight</span>
                  </div>
                  <span className="font-bold text-white text-sm">100 pts</span>
                </div>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0a0a12]/50 backdrop-blur-md flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">True/False Weight</span>
                  </div>
                  <span className="font-bold text-white text-sm">50 pts</span>
                </div>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0a0a12]/50 backdrop-blur-md flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">Passing Marks</span>
                  </div>
                  <span className="font-bold text-white text-sm">70% Accuracy</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PLAYING STATE */}
        {quizState === "playing" && activeQuiz && (
          <motion.div key="playing" {...pageTransition} className="max-w-3xl mx-auto space-y-6">
            
            {/* Header Progress and Timer */}
            <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2 flex-1 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">
                    Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                  </span>
                  <span className="text-sm font-bold text-white">{Math.round(((currentQuestionIdx) / activeQuiz.questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#0f0f1a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestionIdx) / activeQuiz.questions.length) * 100}%` }}
                  />
                </div>
                <h4 className="text-sm font-semibold text-purple-400 pt-1">{activeQuiz.subject}</h4>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-white bg-[#0f0f1a] px-4 py-2.5 rounded-xl border border-white/[0.06]">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{formatTimer(timer)}</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {activeQuiz.questions[currentQuestionIdx].question}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {activeQuiz.questions[currentQuestionIdx].options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIdx] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      className={`p-4 sm:p-5 rounded-xl text-left text-sm sm:text-base font-medium transition-all duration-200 border flex items-center gap-4 group
                        ${isSelected
                          ? "bg-purple-500/10 border-purple-500/50 text-white"
                          : "bg-[#0f0f1a] border-white/[0.06] text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.02]"
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/[0.2] group-hover:border-purple-400/50'}
                      `}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Footer navigator */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/[0.06]">
                <span className="text-sm text-slate-500">
                  {selectedAnswers[currentQuestionIdx] ? 'Answer selected.' : 'Please select an answer.'}
                </span>
                <button
                  onClick={handleNextQuestion}
                  disabled={submitting || !selectedAnswers[currentQuestionIdx]}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{currentQuestionIdx === activeQuiz.questions.length - 1 ? "Submit Quiz" : "Next Question"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS STATE */}
        {quizState === "results" && activeQuiz && (
          <motion.div key="results" {...pageTransition} className="space-y-8">
            
            {/* Summary Metric Score cards */}
            <div className="bg-[#1a1a2e] rounded-3xl border border-purple-500/20 p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.1)]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
              
              {/* lightweight confetti particle shower */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex justify-center">
                  {Array.from({ length: 50 }).map((_, idx) => {
                    const left = Math.random() * 100;
                    const delay = Math.random() * 2;
                    const duration = Math.random() * 2 + 2;
                    const color = ["#8B5CF6", "#06B6D4", "#ec4899", "#3b82f6", "#10b981"][idx % 5];
                    return (
                      <div
                        key={idx}
                        className="absolute w-2 h-2 rounded-sm animate-fall"
                        style={{
                          left: `${left}%`,
                          top: '-10px',
                          backgroundColor: color,
                          animationDelay: `${delay}s`,
                          animationDuration: `${duration}s`,
                          transform: `rotate(${Math.random() * 360}deg)`
                        }}
                      />
                    );
                  })}
                </div>
              )}

              <div className="relative flex flex-col items-center z-10 space-y-6">
                <div className="relative flex items-center justify-center w-40 h-40">
                  <ProgressRing 
                    progress={scoreDetails.pct} 
                    size={160} 
                    strokeWidth={10} 
                    color={scoreDetails.pct >= 70 ? "stroke-emerald-500" : "stroke-rose-500"} 
                  />
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{scoreDetails.pct}%</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Accuracy</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    {scoreDetails.pct >= 90 ? 'Outstanding!' : 
                     scoreDetails.pct >= 70 ? 'Great Job!' : 
                     'Keep Practicing!'}
                  </h2>
                  <p className="text-slate-400 text-sm">You completed the {activeQuiz.subject} quiz.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl pt-4">
                  <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Total</span>
                    <span className="text-2xl font-bold text-white">{scoreDetails.total}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider mb-2">Correct</span>
                    <span className="text-2xl font-bold text-emerald-400">{scoreDetails.score}</span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-xs font-medium text-rose-400/80 uppercase tracking-wider mb-2">Incorrect</span>
                    <span className="text-2xl font-bold text-rose-400">{scoreDetails.total - scoreDetails.score}</span>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-xs font-medium text-purple-400/80 uppercase tracking-wider mb-2">Time</span>
                    <span className="text-2xl font-bold text-purple-400 font-mono">{formatTimer(timer)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-6">
                  <button
                    onClick={() => setQuizState("setup")}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Try Another Quiz
                  </button>
                  <button
                    onClick={() => {
                      setQuizState("setup");
                      setActiveTab("history");
                    }}
                    className="px-6 py-3 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <History className="w-4 h-4" /> View History
                  </button>
                </div>
              </div>
            </div>

            {/* Question Detailed review breakdown */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Detailed Review</h3>
              
              <div className="space-y-4">
                {activeQuiz.questions.map((q, idx) => {
                  const selected = selectedAnswers[idx];
                  const isCorrect = selected === q.correct_answer;
                  
                  return (
                    <div key={idx} className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-medium text-white leading-relaxed">
                          <span className="text-slate-500 mr-2">{idx + 1}.</span> 
                          {q.question}
                        </h4>
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isCorrect ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                          <span className="text-xs font-medium uppercase tracking-wider block mb-2 text-slate-400">Your Answer</span>
                          <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {selected || "No answer submitted"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                            <span className="text-xs font-medium uppercase tracking-wider block mb-2 text-slate-400">Correct Answer</span>
                            <span className="text-sm font-medium text-emerald-400">{q.correct_answer}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">
                          <Sparkles className="w-4 h-4" /> AI Explanation
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && quizState === "setup" && (
          <motion.div key="history" {...pageTransition} className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white">Past Assessments</h3>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-16 px-4 bg-[#0f0f1a] rounded-2xl border border-white/[0.06]">
                  <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No History Yet</h4>
                  <p className="text-sm text-slate-400">Take your first quiz to see your performance over time.</p>
                </div>
              ) : (
                history.map((hist) => {
                  const acc = Math.round((hist.score / hist.total_questions) * 100);
                  return (
                    <div key={hist._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-white/[0.06] bg-[#0f0f1a] hover:border-purple-500/30 transition-all gap-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-white">{hist.subject}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                            hist.difficulty === "easy"
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : hist.difficulty === "hard"
                              ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                              : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                          }`}>
                            {hist.difficulty}
                          </span>
                          <span className="text-xs text-slate-500 px-2 py-1 bg-white/[0.05] rounded-md border border-white/[0.05] uppercase tracking-wider">{hist.type}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatTimer(hist.time_taken)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <ProgressRing progress={acc} size={40} strokeWidth={4} color={acc >= 70 ? "stroke-emerald-500" : "stroke-rose-500"} />
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold ${acc >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                            {acc}%
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {hist.score}/{hist.total_questions}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && quizState === "setup" && (
          <motion.div key="leaderboard" {...pageTransition} className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" /> Global Rankings
              </h3>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-wider">Top Scholars</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-4 w-24">Rank</th>
                    <th className="py-4 px-4">Student</th>
                    <th className="py-4 px-4 text-center">Quizzes</th>
                    <th className="py-4 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-sm text-slate-400 bg-[#0f0f1a]/50">
                        No leaderboard data yet. Be the first to rank!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 px-4">
                          {idx === 0 && <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">1</span>}
                          {idx === 1 && <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-300/20 text-slate-300 border border-slate-300/30 text-sm font-bold">2</span>}
                          {idx === 2 && <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-700/30 text-amber-600 border border-amber-700/40 text-sm font-bold">3</span>}
                          {idx > 2 && <span className="inline-flex items-center justify-center w-8 h-8 text-slate-500 text-sm font-bold">{idx + 1}</span>}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-200 group-hover:text-white transition-colors">{item.name}</td>
                        <td className="py-4 px-4 text-center text-slate-400 font-mono">{item.quizzes_taken}</td>
                        <td className="py-4 px-4 text-right font-bold text-purple-400 font-mono">{item.total_score.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
