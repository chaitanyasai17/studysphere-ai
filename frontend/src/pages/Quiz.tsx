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
  Sparkles
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
  color = "stroke-indigo-500"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90 select-none">
      <circle
        className="stroke-slate-800"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={`${color} transition-all duration-500 ease-out`}
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
    };
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
    } catch (e) {
      addToast("Failed", "AI Quiz generation failed. Verify credentials.", "error");
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header Tabs Navigation */}
      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Quiz Generator</h1>
          <p className="text-xs text-slate-500">Configure AI study evaluations.</p>
        </div>
        
        {quizState === "setup" && (
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-colors ${activeTab === "quiz" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              <Play className="w-3.5 h-3.5" /> Practice
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-colors ${activeTab === "history" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              <History className="w-3.5 h-3.5" /> History
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-colors ${activeTab === "leaderboard" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Leaderboard
            </button>
          </div>
        )}
      </div>

      {/* SETUP TAB */}
      {activeTab === "quiz" && quizState === "setup" && (
        <div className="p-8 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-indigo-500" /> Exam Configuration Wizard
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Category</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures, Modern History"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="easy">Easy Scholar</option>
                    <option value="medium">Medium Master</option>
                    <option value="hard">Hard Graduate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question Types</label>
                  <select
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="tf">True / False</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Number of Questions: {count}</label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-650 h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={loading || !subject.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Quiz...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Practice Exam</span>
                </>
              )}
            </button>
          </div>

          {/* Visual card details for quiz */}
          <div className="p-6 rounded-2xl bg-indigo-950 text-white flex flex-col justify-between relative overflow-hidden border border-indigo-900">
            <div className="absolute top-[-20%] right-[-20%] w-48 h-48 rounded-full filter blur-[50px] bg-indigo-500/25 animate-pulse-slow" />
            
            <div className="space-y-3 z-10">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Active Evaluator</span>
              <h4 className="text-lg font-bold">Scored Leaderboard Analytics</h4>
              <p className="text-[10px] text-indigo-200/70 leading-relaxed">
                Completing quizzes logs accuracy rankings which feeds your study dashboard streak analytics and competitive scholar profiles.
              </p>
            </div>
            
            <div className="p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md space-y-2.5 z-10 text-[10px] text-indigo-200">
              <div className="flex justify-between"><span>MCQ Weight:</span><span className="font-bold text-white">100 pts</span></div>
              <div className="flex justify-between"><span>True/False Weight:</span><span className="font-bold text-white">50 pts</span></div>
              <div className="flex justify-between"><span>Passing Marks:</span><span className="font-bold text-white">70% Accuracy</span></div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING STATE */}
      {quizState === "playing" && activeQuiz && (
        <div className="p-8 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-8">
          
          {/* Header Progress and Timer */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
              </span>
              <h4 className="text-xs font-bold text-slate-600">{activeQuiz.subject}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>{formatTimer(timer)}</span>
            </div>
          </div>

          {/* Question and Option lists */}
          <div className="space-y-6">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {activeQuiz.questions[currentQuestionIdx].question}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {activeQuiz.questions[currentQuestionIdx].options.map((option) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`p-4 rounded-xl text-left text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-650/10"
                        : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer navigator */}
          <div className="flex justify-between items-center border-t pt-6">
            <span className="text-[10px] text-slate-400">Answer is required to advance.</span>
            <button
              onClick={handleNextQuestion}
              disabled={submitting || !selectedAnswers[currentQuestionIdx]}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>{currentQuestionIdx === activeQuiz.questions.length - 1 ? "Submit Answers" : "Next Question"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS STATE */}
      {quizState === "results" && activeQuiz && (
        <div className="space-y-8">
          
          {/* Summary Metric Score cards */}
          <div className="p-8 rounded-3xl border border-indigo-500/25 bg-indigo-950/20 text-white text-center space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/20 filter blur-[80px]" />
            
            {/* lightweight confetti particle shower */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex justify-center">
                {Array.from({ length: 45 }).map((_, idx) => {
                  const left = Math.random() * 100;
                  const delay = Math.random() * 2.5;
                  const duration = Math.random() * 2 + 2;
                  const color = ["#8B5CF6", "#A855F7", "#ec4899", "#3b82f6", "#22c55e"][idx % 5];
                  return (
                    <div
                      key={idx}
                      className="absolute w-2 h-2 rounded-sm animate-fall"
                      style={{
                        left: `${left}%`,
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

            <div className="relative flex items-center justify-center mx-auto my-4 w-28 h-28 z-10">
              <ProgressRing 
                progress={scoreDetails.pct} 
                size={112} 
                strokeWidth={8} 
                color={scoreDetails.pct >= 70 ? "stroke-emerald-500" : "stroke-rose-500"} 
              />
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black">{scoreDetails.pct}%</span>
                <span className="text-[9px] font-bold uppercase text-slate-400">Accuracy</span>
              </div>
            </div>

            <div className="space-y-2 z-10 relative">
              <h2 className="text-2xl font-extrabold">Practice Exam Complete</h2>
              <p className="text-xs text-indigo-200/80">Subject: {activeQuiz.subject}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto pt-4 z-10 relative">
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-indigo-300 block">Total Questions</span>
                <span className="text-lg font-bold block mt-1">{scoreDetails.total}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-indigo-300 block">Correct Answers</span>
                <span className="text-lg font-bold block mt-1 text-emerald-400">{scoreDetails.score}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-indigo-300 block">Accuracy Rate</span>
                <span className={`text-lg font-bold block mt-1 ${scoreDetails.pct >= 70 ? "text-emerald-400" : "text-rose-450"}`}>{scoreDetails.pct}%</span>
              </div>
            </div>

            <div className="pt-4 z-10 relative">
              <button
                onClick={() => setQuizState("setup")}
                className="px-6 py-2.5 bg-white hover:bg-slate-100 text-indigo-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Configuration
              </button>
            </div>
          </div>

          {/* Question Detailed review breakdown with explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Question Reviews & Explanations</h3>
            
            <div className="flex flex-col gap-4">
              {activeQuiz.questions.map((q, idx) => {
                const selected = selectedAnswers[idx];
                const isCorrect = selected === q.correct_answer;
                
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-xs sm:text-sm font-bold leading-relaxed text-slate-850 dark:text-white">
                        {idx + 1}. {q.question}
                      </h4>
                      <div className="flex-shrink-0 mt-0.5">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className={`p-2.5 rounded-lg border ${isCorrect ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600" : "bg-rose-500/5 border-rose-500/10 text-rose-500"}`}>
                        <span className="block font-bold mb-1">Your Answer:</span>
                        <span>{selected || "No answer submitted"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-emerald-500/5 border-emerald-500/10 text-emerald-600">
                        <span className="block font-bold mb-1">Correct Answer:</span>
                        <span>{q.correct_answer}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/15 text-[11px] leading-relaxed text-slate-350">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-black text-[9px] uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI Explanation
                      </div>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Practice Exam History</h3>
          
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No history records found. Study and complete tests first!
              </div>
            ) : (
              history.map((hist) => {
                const acc = Math.round((hist.score / hist.total_questions) * 100);
                return (
                  <div key={hist._id} className="flex items-center justify-between p-4.5 rounded-2xl border border-white/5 bg-[#161720]/40 hover:border-indigo-500/30 transition-all select-none">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">{hist.subject}</h4>
                      <div className="flex flex-wrap gap-2 items-center text-[9px] font-mono text-slate-455 uppercase">
                        <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold uppercase ${
                          hist.difficulty === "easy"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : hist.difficulty === "hard"
                            ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                            : "text-amber-500 bg-amber-500/10 border-amber-500/20"
                        }`}>
                          {hist.difficulty}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-805">{hist.type.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatTimer(hist.time_taken)} taken</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing progress={acc} size={28} strokeWidth={3} color={acc >= 70 ? "stroke-emerald-500" : "stroke-rose-500"} />
                      <span className={`text-[11px] font-black font-mono ${acc >= 70 ? "text-emerald-400" : "text-rose-450"}`}>
                        {hist.score}/{hist.total_questions} ({acc}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-6">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center select-none">
            <h3 className="text-xs font-bold text-slate-200">Competitive Scholar Rankings</h3>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Top 10 Global Scores</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-450 font-bold uppercase tracking-wider text-[9px] select-none">
                  <th className="py-2.5">Rank</th>
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5 text-center">Quizzes Done</th>
                  <th className="py-2.5 text-right">Cumulative Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-xs text-slate-450">
                      No leaderboard scores available.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 font-bold">
                        {idx === 0 && <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 text-[9px] font-black font-mono">GOLD #1</span>}
                        {idx === 1 && <span className="px-2 py-0.5 rounded-lg bg-slate-300/10 text-slate-350 text-[9px] font-black font-mono">SILVER #2</span>}
                        {idx === 2 && <span className="px-2 py-0.5 rounded-lg bg-amber-700/10 text-amber-600 text-[9px] font-black font-mono">BRONZE #3</span>}
                        {idx > 2 && <span className="text-slate-500 font-mono pl-2">#{idx + 1}</span>}
                      </td>
                      <td className="py-3.5 font-bold text-slate-200">{item.name}</td>
                      <td className="py-3.5 text-center text-slate-400 font-mono font-bold">{item.quizzes_taken}</td>
                      <td className="py-3.5 text-right font-black text-indigo-400 font-mono">{item.total_score} pts</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
