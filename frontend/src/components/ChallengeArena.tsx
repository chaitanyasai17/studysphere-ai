import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Swords,
  Brain,
  Code,
  Shield,
  Sparkles,
  Flame,
  CheckCircle,
  XCircle,
  ArrowRight,
  X,
  UserCheck,
  Lock,
  RotateCcw,
  Loader2,
  Award,
  Zap
} from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  isUser?: boolean;
}

export const ChallengeArena: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Player State
  const [playerXP, setPlayerXP] = useState(7250);
  const [playerLevel, setPlayerLevel] = useState(12);
  const [streakDays, setStreakDays] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);

  // Embedded Mini Quiz State
  const [miniQuizSelected, setMiniQuizSelected] = useState<number | null>(null);
  const [miniQuizAnswered, setMiniQuizAnswered] = useState(false);
  const [miniQuizCorrect, setMiniQuizCorrect] = useState(false);

  // Active Challenge Modal State
  const [activeModal, setActiveModal] = useState<"quiz" | "code" | "cyber" | null>(null);

  // Challenge Progress States
  const [quizQIndex, setQuizQIndex] = useState(0);
  const [quizOption, setQuizOption] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const [codeRunning, setCodeRunning] = useState(false);
  const [codeCompleted, setCodeCompleted] = useState(false);

  const [cyberOption, setCyberOption] = useState<number | null>(null);
  const [cyberCompleted, setCyberCompleted] = useState(false);

  const [showAuthGate, setShowAuthGate] = useState(false);

  // Badges State
  const [badges, setBadges] = useState<BadgeItem[]>([
    { id: "first", name: "First Steps", icon: "🏆", unlocked: true },
    { id: "streak", name: "7 Day Streak", icon: "🔥", unlocked: false },
    { id: "code", name: "Code Explorer", icon: "💻", unlocked: true },
    { id: "seeker", name: "Knowledge Seeker", icon: "📚", unlocked: true },
    { id: "cyber", name: "Cyber Defender", icon: "🔐", unlocked: false }
  ]);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([
    { rank: 1, name: "Alex", xp: 12450 },
    { rank: 2, name: "Priya", xp: 10820 },
    { rank: 3, name: "You", xp: 7250, isUser: true },
    { rank: 4, name: "Rahul", xp: 6900 }
  ]);

  // Sync leaderboard when player XP updates
  useEffect(() => {
    setLeaderboard((prev) =>
      prev
        .map((u) => (u.isUser ? { ...u, xp: playerXP } : u))
        .sort((a, b) => b.xp - a.xp)
        .map((u, idx) => ({ ...u, rank: idx + 1 }))
    );
  }, [playerXP]);

  // Trigger temporary confetti effect
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const addXP = (amount: number) => {
    setPlayerXP((prev) => {
      const nextXP = prev + amount;
      if (nextXP >= 10000) {
        setPlayerLevel(13);
      }
      return nextXP;
    });
    triggerConfetti();
  };

  // Mini Quiz Handler
  const handleMiniQuizOption = (idx: number) => {
    if (miniQuizAnswered && miniQuizCorrect) return;

    setMiniQuizSelected(idx);
    setMiniQuizAnswered(true);

    if (idx === 1) {
      // Correct answer: O(log n)
      setMiniQuizCorrect(true);
      addXP(50);
    } else {
      setMiniQuizCorrect(false);
    }
  };

  // Quiz Modal Handlers
  const handleQuizOption = (idx: number) => {
    if (quizOption !== null) return;
    setQuizOption(idx);

    if (idx === 0) {
      // Correct
      addXP(150);
      setQuizCompleted(true);
    }

    if (!isAuthenticated) {
      setTimeout(() => setShowAuthGate(true), 1200);
    }
  };

  // Code Challenge Runner
  const handleRunCode = () => {
    setCodeRunning(true);
    setTimeout(() => {
      setCodeRunning(false);
      setCodeCompleted(true);
      addXP(250);

      if (!isAuthenticated) {
        setTimeout(() => setShowAuthGate(true), 1200);
      }
    }, 1500);
  };

  // Cyber Challenge Selection
  const handleCyberOption = (idx: number) => {
    setCyberOption(idx);
    if (idx === 0) {
      setCyberCompleted(true);
      addXP(300);
      // Unlock Cyber Defender badge
      setBadges((prev) =>
        prev.map((b) => (b.id === "cyber" ? { ...b, unlocked: true } : b))
      );
    }

    if (!isAuthenticated) {
      setTimeout(() => setShowAuthGate(true), 1200);
    }
  };

  const openModal = (type: "quiz" | "code" | "cyber") => {
    setActiveModal(type);
    setShowAuthGate(false);
    setQuizOption(null);
    setQuizCompleted(false);
    setCodeRunning(false);
    setCodeCompleted(false);
    setCyberOption(null);
    setCyberCompleted(false);
  };

  const maxLevelXP = 10000;
  const xpPercentage = Math.min(100, Math.round((playerXP / maxLevelXP) * 100));

  return (
    <section id="arena" className="max-w-[1440px] mx-auto px-6 space-y-12 select-none relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[950px] h-[500px] bg-gradient-to-r from-purple-600/15 via-indigo-500/15 to-sky-500/15 blur-[130px] rounded-full pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

      {/* Particle / Confetti Burst Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden flex items-center justify-center">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: ["#a855f7", "#38bdf8", "#34d399", "#fbbf24", "#f43f5e"][i % 5]
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                scale: Math.random() * 1.5 + 0.5,
                opacity: 0
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      {/* Header Section Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto space-y-4 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-widest">
          <Swords className="w-3.5 h-3.5" /> Gamified Skill Arena
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-tight">
          StudySphere Challenge Arena
        </h2>
        <p className="text-sm sm:text-base text-[#C5CAD3] leading-relaxed">
          Learn, solve challenges, earn XP, and level up your skills.
        </p>
      </motion.div>

      {/* 1. PLAYER PROFILE AREA & LEADERBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 max-w-5xl mx-auto">
        {/* Player Profile Card (8 Columns) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#10121B]/90 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Circular Animated Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-purple-500/30">
                  <div className="w-full h-full rounded-2xl bg-[#0B0C12] flex items-center justify-center text-purple-300 font-bold text-xl">
                    <Trophy className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0B0C12] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </span>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-white">Level {playerLevel} Learner</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono text-purple-300 font-bold">
                    Demo Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400">Mastering Data Structures &amp; AI Systems</p>
              </div>
            </div>

            {/* Streak Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold flex items-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span>{streakDays} Day Study Streak 🔥</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Current Progress</span>
              <span className="text-purple-300 font-bold">
                {playerXP.toLocaleString()} / {maxLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-850 p-0.5 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* 3. ACHIEVEMENT BADGES ROW */}
          <div className="pt-2 border-t border-slate-855 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block text-center sm:text-left">
              Achievement Badges
            </span>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2.5">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
                    b.unlocked
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-200 shadow-md shadow-purple-500/10 hover:scale-105"
                      : "bg-slate-950/60 border-slate-850 text-slate-600 opacity-60"
                  }`}
                >
                  <span>{b.icon}</span>
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 5. COMPACT LEADERBOARD (4 Columns) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-4 p-6 rounded-3xl bg-[#10121B]/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Weekly Top</span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((u) => (
              <div
                key={u.name}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  u.isUser
                    ? "bg-purple-500/20 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/30"
                    : "bg-[#0A0B10] border-slate-850 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
                      u.rank === 1
                        ? "bg-amber-400 text-slate-950"
                        : u.rank === 2
                        ? "bg-slate-300 text-slate-950"
                        : u.rank === 3
                        ? "bg-amber-700 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {u.rank}
                  </span>
                  <span>{u.name}</span>
                </div>
                <span className="font-mono text-amber-400 text-[11px]">
                  {u.xp.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[10px] font-mono text-slate-500 text-center">
            Earn XP to climb the arena rankings!
          </div>
        </motion.div>
      </div>

      {/* 2. DAILY CHALLENGES (3 Interactive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 max-w-5xl mx-auto">
        {/* Challenge 1: 🧠 AI Quick Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-[#10121B]/90 backdrop-blur-md flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono text-purple-300 font-bold">
                +150 XP Reward
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                🧠 AI Quick Quiz
              </h3>
              <p className="text-xs text-[#C5CAD3] leading-relaxed">
                Answer 5 automated AI questions to test core knowledge.
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal("quiz")}
            className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Start Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Challenge 2: 💻 Code Sprint */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-[#10121B]/90 backdrop-blur-md flex flex-col justify-between group hover:border-sky-500/40 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code className="w-5 h-5 text-sky-400" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[9px] font-mono text-sky-300 font-bold">
                +250 XP Reward
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                💻 Code Sprint
              </h3>
              <p className="text-xs text-[#C5CAD3] leading-relaxed">
                Solve a programming challenge and verify test cases.
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal("code")}
            className="mt-6 w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Start Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Challenge 3: 🔐 Cyber Mission */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-6 sm:p-7 rounded-3xl border border-slate-800 bg-[#10121B]/90 backdrop-blur-md flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300 relative overflow-hidden shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-rose-400" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono text-rose-300 font-bold">
                +300 XP Reward
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                🔐 Cyber Mission
              </h3>
              <p className="text-xs text-[#C5CAD3] leading-relaxed">
                Complete a cybersecurity scenario &amp; unlock Defender badge.
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal("cyber")}
            className="mt-6 w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Start Challenge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* 4. EMBEDDED MINI QUIZ GAME */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-xl shadow-2xl space-y-5 relative z-10 text-left"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Instant Quiz Arena Demo
            </h4>
          </div>
          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Instant +50 XP
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Question: What is the time complexity of binary search?
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "O(n)", correct: false },
            { label: "O(log n)", correct: true },
            { label: "O(n²)", correct: false },
            { label: "O(1)", correct: false }
          ].map((opt, idx) => {
            const isSelected = miniQuizSelected === idx;
            let btnStyle = "bg-[#12131C] border-slate-800 text-slate-200 hover:border-purple-500/50";

            if (miniQuizAnswered) {
              if (opt.correct) {
                btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20";
              } else if (isSelected) {
                btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200 animate-shake";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleMiniQuizOption(idx)}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer outline-none flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt.label}</span>
                {miniQuizAnswered && opt.correct && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                {miniQuizAnswered && isSelected && !opt.correct && (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {miniQuizAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              miniQuizCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span>
              {miniQuizCorrect
                ? "Correct! Binary Search divides input range by half each step."
                : "Incorrect answer. Try selecting O(log n)!"}
            </span>
            {miniQuizCorrect && (
              <span className="font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                +50 XP Added!
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* CHALLENGE MODAL OVERLAY */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0D0E15] p-6 sm:p-8 shadow-2xl relative space-y-6 text-left"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* QUIZ MODAL */}
              {activeModal === "quiz" && (
                <div className="space-y-5">
                  {!showAuthGate ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-purple-400 font-bold">🧠 AI Quick Quiz Challenge</span>
                        <h4 className="text-base font-bold text-white">What is the primary advantage of binary search over linear search?</h4>
                      </div>

                      <div className="space-y-2">
                        {["Logarithmic time complexity O(log n)", "Linear space complexity O(n)", "Operates on unsorted arrays", "Requires constant space O(1)"].map((opt, idx) => {
                          const isSelected = quizOption === idx;
                          const isCorrect = idx === 0;
                          let btnStyle = "bg-[#12131C] border-slate-800 text-slate-200 hover:border-purple-500/50";
                          if (quizOption !== null) {
                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md";
                            else if (isSelected) btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200 animate-shake";
                          }

                          return (
                            <button
                              key={idx}
                              disabled={quizOption !== null}
                              onClick={() => handleQuizOption(idx)}
                              className={`w-full p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer outline-none ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {quizOption !== null && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                              {quizOption !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizCompleted && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                          Correct! +150 XP Awarded to profile!
                        </motion.div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {/* CODE MODAL */}
              {activeModal === "code" && (
                <div className="space-y-5">
                  {!showAuthGate ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-sky-400 font-bold">💻 Code Sprint Challenge</span>
                        <h4 className="text-base font-bold text-white">Reverse a string in Python</h4>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#06070B] border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                        <p className="text-indigo-400">def <span className="text-sky-300">reverse_string</span>(s):</p>
                        <p className="pl-4 text-slate-500"># Return reversed string slice</p>
                        <p className="pl-4"><span className="text-indigo-400">return</span> s[::-1]</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-mono">Test Cases: Ready</span>
                        <button
                          disabled={codeRunning}
                          onClick={handleRunCode}
                          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        >
                          {codeRunning ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Running Tests...</span>
                            </>
                          ) : (
                            <span>Run Tests (+250 XP)</span>
                          )}
                        </button>
                      </div>

                      {codeCompleted && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                          Test Case Passed ✓ +250 XP Awarded!
                        </motion.div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {/* CYBER MODAL */}
              {activeModal === "cyber" && (
                <div className="space-y-5">
                  {!showAuthGate ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-rose-400 font-bold">🔐 Cyber Mission Challenge</span>
                        <h4 className="text-base font-bold text-white">Audit Security Payload</h4>
                        <p className="text-xs text-slate-400">
                          Scenario: Identify the vulnerability type when a payload alters database queries.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {["SQL Injection (SQLi)", "Cross-Site Scripting (XSS)", "CSRF Token Forgery", "Buffer Overflow"].map((opt, idx) => {
                          const isSelected = cyberOption === idx;
                          const isCorrect = idx === 0;
                          let btnStyle = "bg-[#12131C] border-slate-800 text-slate-200 hover:border-rose-500/50";
                          if (cyberOption !== null) {
                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md";
                            else if (isSelected) btnStyle = "bg-rose-500/20 border-rose-500 text-rose-200 animate-shake";
                          }

                          return (
                            <button
                              key={idx}
                              disabled={cyberOption !== null}
                              onClick={() => handleCyberOption(idx)}
                              className={`w-full p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer outline-none ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {cyberOption !== null && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                              {cyberOption !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {cyberCompleted && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
                          Mission Complete ✓ Cyber Defender Badge Unlocked +300 XP!
                        </motion.div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {/* AUTH GATE FOR VISITORS */}
              {showAuthGate && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-4 border-t border-slate-850 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Create a free account to continue your learning journey</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Save your progress, unlock advanced learning modules, and track your XP level.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Link
                      to="/login"
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Register Free
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
