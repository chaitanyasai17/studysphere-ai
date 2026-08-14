import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Brain,
  Code,
  Shield,
  Play,
  CheckCircle,
  XCircle,
  Sparkles,
  Flame,
  ArrowRight,
  X,
  RotateCcw,
  UserCheck,
  Lock,
  Loader2
} from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the average time complexity of searching in a hash table?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
    correct: 0,
    explanation: "Hash tables achieve O(1) average lookup time by computing key hash indices directly."
  },
  {
    question: "Which HTTP status code indicates a successful resource creation?",
    options: ["200 OK", "201 Created", "404 Not Found", "500 Server Error"],
    correct: 1,
    explanation: "HTTP 201 Created indicates that the request succeeded and a new resource was created."
  },
  {
    question: "What does RAG stand for in modern AI architectures?",
    options: [
      "Rapid Algorithm Generation",
      "Retrieval-Augmented Generation",
      "Random Access Graph",
      "Recursive Array Grid"
    ],
    correct: 1,
    explanation: "Retrieval-Augmented Generation connects LLMs with verified external document stores."
  },
  {
    question: "Which data structure operates on a First-In, First-Out (FIFO) order?",
    options: ["Stack", "Queue", "Heap", "Binary Tree"],
    correct: 1,
    explanation: "Queues process items in FIFO order, where the first inserted element is processed first."
  },
  {
    question: "What is the primary function of JWT in web authentication?",
    options: [
      "Database Encryption",
      "Stateless Signed Token Exchange",
      "CSS Asset Minification",
      "Load Balancing"
    ],
    correct: 1,
    explanation: "JSON Web Tokens securely pass verifiable claims between client and server without server state."
  }
];

export const ChallengeSkills: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Demo XP state
  const [demoXP, setDemoXP] = useState(1250);
  const [completedCount, setCompletedCount] = useState(12);

  // Active Challenge Modal State
  const [activeModal, setActiveModal] = useState<"quiz" | "code" | "cyber" | null>(null);

  // Quiz Modal State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  // Code Challenge State
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);

  // Cyber Challenge State
  const [cyberOption, setCyberOption] = useState<number | null>(null);
  const [cyberSuccess, setCyberSuccess] = useState(false);

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    setShowAuthGate(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);

    const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correct;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      setDemoXP((prev) => prev + 16);
    }

    if (!isAuthenticated && quizIndex >= 0) {
      setTimeout(() => setShowAuthGate(true), 1200);
      return;
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedOption(null);
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      setCompletedCount((prev) => prev + 1);
    }
  };

  const handleRunCodeChallenge = () => {
    setCodeRunning(true);
    setTimeout(() => {
      setCodeRunning(false);
      setCodeSuccess(true);
      setDemoXP((prev) => prev + 100);
      setCompletedCount((prev) => prev + 1);

      if (!isAuthenticated) {
        setTimeout(() => setShowAuthGate(true), 1200);
      }
    }, 1500);
  };

  const handleSelectCyberOption = (idx: number) => {
    setCyberOption(idx);
    if (idx === 0) {
      setCyberSuccess(true);
      setDemoXP((prev) => prev + 120);
      setCompletedCount((prev) => prev + 1);
    }

    if (!isAuthenticated) {
      setTimeout(() => setShowAuthGate(true), 1200);
    }
  };

  const openChallenge = (type: "quiz" | "code" | "cyber") => {
    setActiveModal(type);
    setShowAuthGate(false);
    if (type === "quiz") resetQuiz();
    if (type === "code") {
      setCodeRunning(false);
      setCodeSuccess(false);
    }
    if (type === "cyber") {
      setCyberOption(null);
      setCyberSuccess(false);
    }
  };

  return (
    <section id="challenges" className="max-w-[1440px] mx-auto px-6 space-y-12 select-none relative">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[900px] h-[450px] bg-gradient-to-r from-purple-600/10 via-indigo-500/10 to-sky-500/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Header Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto space-y-4 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
          <Trophy className="w-3.5 h-3.5" /> Interactive Practice Modes
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          Challenge Your Skills
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Learn by doing. Choose a challenge and put your knowledge to the test.
        </p>
      </motion.div>

      {/* Gamified Demo Progress Dashboard Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-4xl mx-auto p-4 sm:p-6 rounded-3xl bg-[#121422] border border-slate-750 backdrop-blur-xl shadow-2xl space-y-4 relative z-10"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              Demo Learning Progress
            </span>
            <span className="text-xs font-bold text-slate-200">Level 3 Scholar</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-200 font-mono font-bold">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>{demoXP.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Trophy className="w-4 h-4" />
              <span>{completedCount} Cleared</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>🔥 4 Days</span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-300 font-bold">
            <span>Next Rank: Level 4 Senior Scholar</span>
            <span className="text-purple-300 font-bold">72% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: "72%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* 3 Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 max-w-5xl mx-auto">
        {/* Card 1: AI QUIZ CHALLENGE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-8 rounded-3xl border border-slate-750 bg-[#121422] backdrop-blur-md flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                Beginner
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  AI Quiz Challenge
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test core concepts with automated multiple-choice queries and instant AI feedback.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-200 font-medium">
              <div className="flex items-center gap-2">✓ 5 Quick Questions</div>
              <div className="flex items-center gap-2">✓ AI-powered explanations</div>
              <div className="flex items-center gap-2 text-emerald-300 font-bold">✓ Earn XP for correct answers</div>
            </div>
          </div>

          <button
            onClick={() => openChallenge("quiz")}
            className="mt-8 w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Start Quiz</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Card 2: CODE CHALLENGE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-8 rounded-3xl border border-slate-750 bg-[#121422] backdrop-blur-md flex flex-col justify-between group hover:border-sky-500/50 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6 text-sky-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-[10px] font-bold text-sky-300 uppercase tracking-widest">
                Intermediate
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-sky-400" />
                <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                  Code Challenge
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Solve coding problems, run automated test cases, and analyze algorithmic efficiency.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-200 font-medium">
              <div className="flex items-center gap-2">✓ Solve coding problems</div>
              <div className="flex items-center gap-2">✓ Test your logic in Python</div>
              <div className="flex items-center gap-2 text-sky-300 font-bold">✓ Analyze your solution</div>
            </div>
          </div>

          <button
            onClick={() => openChallenge("code")}
            className="mt-8 w-full h-12 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Start Coding</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Card 3: CYBER CHALLENGE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-8 rounded-3xl border border-slate-750 bg-[#121422] backdrop-blur-md flex flex-col justify-between group hover:border-rose-500/50 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-rose-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                Advanced
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">
                  Cyber Challenge
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Identify security vulnerabilities, audit HTTP traffic, and solve security scenarios.
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-200 font-medium">
              <div className="flex items-center gap-2">✓ Identify security concepts</div>
              <div className="flex items-center gap-2">✓ Solve cyber scenarios</div>
              <div className="flex items-center gap-2 text-rose-300 font-bold">✓ Learn through challenges</div>
            </div>
          </div>

          <button
            onClick={() => openChallenge("cyber")}
            className="mt-8 w-full h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Enter Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* CHALLENGE MODALS OVERLAY */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl rounded-3xl border border-slate-750 bg-[#121422] p-6 sm:p-8 shadow-2xl relative space-y-6 text-left"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-750 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* QUIZ MODAL CONTENT */}
              {activeModal === "quiz" && (
                <div className="space-y-6">
                  {!showAuthGate && !quizFinished && (
                    <>
                      <div className="space-y-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                            <Brain className="w-4.5 h-4.5 text-purple-400" />
                            <span>AI Quiz Challenge</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-200">
                            Question {quizIndex + 1} / {QUIZ_QUESTIONS.length}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <motion.div
                            className="h-full bg-emerald-500"
                            animate={{ width: `${((quizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-white">
                        {QUIZ_QUESTIONS[quizIndex].question}
                      </h4>

                      <div className="space-y-2.5">
                        {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                          const isSelected = selectedOption === idx;
                          const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correct;
                          let btnStyle = "bg-[#1A1C2B] border-slate-700 text-white font-bold hover:border-purple-400 hover:bg-[#22253A]";

                          if (selectedOption !== null) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-500/25 border-emerald-400 text-white font-bold shadow-md";
                            } else if (isSelected) {
                              btnStyle = "bg-rose-500/25 border-rose-400 text-white font-bold animate-shake";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={selectedOption !== null}
                              onClick={() => handleOptionSelect(idx)}
                              className={`w-full p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all cursor-pointer outline-none ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {selectedOption !== null && isCorrect && (
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              )}
                              {selectedOption !== null && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOption !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                        >
                          <span className="text-xs font-mono text-emerald-400 font-bold block">AI Explanation</span>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {QUIZ_QUESTIONS[quizIndex].explanation}
                          </p>
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={handleNextQuizQuestion}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Next Question</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {quizFinished && !showAuthGate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white">Great Job! Keep Learning 🚀</h3>
                        <p className="text-xs text-slate-300 font-medium">Quiz Challenge Completed</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-center gap-6 font-mono text-sm">
                        <div>Score: <span className="text-emerald-400 font-bold">{quizScore} / {QUIZ_QUESTIONS.length}</span></div>
                        <div>Awarded: <span className="text-amber-300 font-bold">+{quizScore * 16} XP</span></div>
                      </div>
                      <button
                        onClick={resetQuiz}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Challenge
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
