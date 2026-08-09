import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import api from "../services/api";
import {
  Flame,
  Clock,
  CheckCircle,
  MessageSquare,
  Upload,
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  Code,
  Briefcase,
  FileBadge,
  Sparkles,
  Zap,
  Activity,
  Plus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardStats {
  total_study_hours: number;
  current_streak: number;
  quiz_accuracy_pct: number;
  productivity_score: number;
  total_notes: number;
  completed_tasks: number;
  total_tasks: number;
  insights: string[];
}

interface ChartItem {
  date: string;
  day: string;
  hours: number;
  quizzes: number;
  notes: number;
}

interface TaskItem {
  _id: string;
  title: string;
  start_date: string;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
}

interface ChatItem {
  _id: string;
  title: string;
  updated_at: string;
}

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 w-full animate-pulse">
      <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
      </div>
    </div>
  );
};

const CountUp: React.FC<{ end: number; duration?: number }> = ({ end, duration = 1.2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
};

const formatValueAndAnimate = (val: string | number) => {
  const str = String(val);
  const match = str.match(/[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    const suffix = str.replace(match[0], "");
    return (
      <>
        <CountUp end={num} />
        {suffix}
      </>
    );
  }
  return <>{val}</>;
};

export const Dashboard: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 25
      } 
    }
  };

  const { user, statsSync, syncStats } = useAuth();
  const { addToast } = useNotifications();

  // Listen to cross-tab stats sync events
  useEffect(() => {
    if (statsSync) {
      setProfile((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          xp_points: statsSync.xp,
          coins: statsSync.coins,
        };
      });
      if (statsSync.dailyChallengeClaimed) {
        const todayStr = new Date().toISOString();
        setLastClaimDate(todayStr);
      }
    }
  }, [statsSync]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [_tasks, _setTasks] = useState<TaskItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<"hours" | "quizzes" | "notes" | "pie">("hours");

  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");

  // Daily Challenge State
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [countdownStr, setCountdownStr] = useState<string>("23:59:59");

  // Animation Triggers
  const [flyingParticles, setFlyingParticles] = useState<any[]>([]);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good Morning");
    else if (hr < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const quotes = [
      "Focus is a muscle. Train it every single day.",
      "Small daily improvements yield massive academic success.",
      "Coding and networking are compounds of continuous dedication.",
      "Consistency is the secret bridge between syllabus and career placements."
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const loadDashboardData = async () => {
    try {
      const tzOffset = new Date().getTimezoneOffset();
      const [statsRes, chartsRes, tasksRes, chatsRes, profileRes, notesRes, pdfsRes, resumesRes] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/charts"),
        api.get("/api/planner/tasks"),
        api.get("/api/ai/chats"),
        api.get("/api/profile", { params: { timezone_offset: tzOffset } }).catch(() => {
          // Fallback from localStorage
          const savedDate = localStorage.getItem("lastClaimDate");
          const savedHistory = localStorage.getItem("rewardHistory");
          const xp = parseInt(localStorage.getItem("xp_points") || "0");
          const coins = parseInt(localStorage.getItem("coins") || "0");
          const lvl = parseInt(localStorage.getItem("level") || "1");
          return {
            data: {
              lastClaimDate: savedDate || null,
              rewardHistory: savedHistory ? JSON.parse(savedHistory) : [],
              xp_points: xp,
              coins: coins,
              level: lvl,
              claimStatus: savedDate && new Date().toDateString() === new Date(savedDate).toDateString() ? "claimed" : "eligible"
            }
          };
        }),
        api.get("/api/notes").catch(() => ({ data: [] })),
        api.get("/api/pdf").catch(() => ({ data: [] })),
        api.get("/api/resume/history").catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setChartData(chartsRes.data);
      _setTasks(tasksRes.data.filter((t: any) => !t.is_completed).slice(0, 3));
      setChats(chatsRes.data.slice(0, 3));
      
      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
        setLastClaimDate(profileRes.data.lastClaimDate || null);
        setRewardHistory(profileRes.data.rewardHistory || []);
        
        // Sync profile fields with local storage to build a resilient experience
        if (profileRes.data.lastClaimDate) {
          localStorage.setItem("lastClaimDate", profileRes.data.lastClaimDate);
        }
        localStorage.setItem("xp_points", String(profileRes.data.xp_points || 0));
        localStorage.setItem("coins", String(profileRes.data.coins || 0));
        localStorage.setItem("level", String(profileRes.data.level || 1));
      }
      if (notesRes && notesRes.data) setNotes(notesRes.data.slice(0, 2));
      if (pdfsRes && pdfsRes.data) setPdfs(pdfsRes.data.slice(0, 2));
      if (resumesRes && resumesRes.data) setResumes(resumesRes.data.slice(0, 2));

    } catch (e) {
      console.error(e);
      addToast("Connection Error", "Could not fetch dynamic dashboard summaries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);


  const todayLocalDate = new Date().toDateString();
  const lastClaimLocalDate = lastClaimDate ? new Date(lastClaimDate).toDateString() : "";
  const isAvailable = todayLocalDate !== lastClaimLocalDate;

  // Countdown timer to the next local midnight
  useEffect(() => {
    const updateCountdown = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const target = tomorrow.getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdownStr("00:00:00");
        // Automatically trigger sync when dates rollover
        loadDashboardData();
      } else {
        const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n: number) => n.toString().padStart(2, "0");
        setCountdownStr(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastClaimDate]);

  const triggerFlyingParticles = () => {
    const list = [];
    for (let i = 0; i < 8; i++) {
      list.push({ id: Math.random(), type: "xp" as const, delay: i * 0.08 });
      list.push({ id: Math.random(), type: "coin" as const, delay: i * 0.08 + 0.04 });
    }
    setFlyingParticles(list);
    setTimeout(() => {
      setFlyingParticles([]);
    }, 2000);
  };

  const triggerConfetti = () => {
    const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
    const list = [];
    for (let i = 0; i < 45; i++) {
      list.push({
        id: Math.random(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 40 + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        scale: Math.random() * 0.6 + 0.4,
        rotation: Math.random() * 360,
      });
    }
    setConfettiParticles(list);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiParticles([]);
    }, 3500);
  };

  const handleClaimChallenge = async () => {
    if (!isAvailable || claiming) return;
    try {
      setClaiming(true);
      const tzOffset = new Date().getTimezoneOffset();
      const res = await api.post("/api/profile/add-xp", { 
        action: "challenge",
        timezone_offset: tzOffset
      });

      const claimTime = new Date().toISOString();
      setLastClaimDate(claimTime);
      localStorage.setItem("lastClaimDate", claimTime);

      const newHistory = [...rewardHistory, { claimed_at: claimTime, xp_awarded: 50, coins_awarded: 10 }];
      setRewardHistory(newHistory);
      localStorage.setItem("rewardHistory", JSON.stringify(newHistory));

      // Trigger animations
      triggerFlyingParticles();
      triggerConfetti();
      setShowCheckmark(true);
      setTimeout(() => setShowCheckmark(false), 3000);

      // Toast notification
      addToast("🎉 Daily Challenge Completed", `You earned +50 XP and +10 Coins!`, "success");

      // Synchronize dashboard and header stats instantly
      if (res.data) {
        setProfile((prev: any) => ({
          ...prev,
          xp_points: res.data.total_xp,
          coins: res.data.total_coins,
          level: res.data.level,
          lastClaimDate: res.data.lastClaimDate,
          claimStatus: "claimed"
        }));
        
        localStorage.setItem("xp_points", String(res.data.total_xp));
        localStorage.setItem("coins", String(res.data.total_coins));
        localStorage.setItem("level", String(res.data.level));

        // Sync with all other tabs
        syncStats(res.data.total_xp, res.data.total_coins, true);
      }

      // Sync overall context recommendations
      try {
        await api.post("/api/notifications/trigger");
      } catch (err) {
        console.error(err);
      }

      // Reload remaining components to keep all views synchronized
      loadDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not claim daily challenge reward.";
      addToast("Action Error", msg, "error");
      loadDashboardData();
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  // 12 KPI Metrics aggregator
  const kpiStats = [
    { label: "XP Points", val: profile?.xp_points || 0, icon: <Sparkles className="w-4 h-4 text-indigo-500" />, pct: 75, bg: "from-indigo-500/10 to-indigo-600/5" },
    { label: "Academic Level", val: profile?.level || 1, icon: <Award className="w-4 h-4 text-amber-500" />, pct: 85, bg: "from-amber-500/10 to-amber-600/5" },
    { label: "Coins Balance", val: `🪙 ${profile?.coins || 0}`, icon: <Zap className="w-4 h-4 text-yellow-500" />, pct: 90, bg: "from-yellow-500/10 to-yellow-600/5" },
    { label: "Study Streak", val: `${stats?.current_streak || 0} Days`, icon: <Flame className="w-4 h-4 text-orange-500" />, pct: 60, bg: "from-orange-500/10 to-orange-600/5" },
    { label: "Study Hours", val: `${stats?.total_study_hours || 0} hrs`, icon: <Clock className="w-4 h-4 text-sky-500" />, pct: 80, bg: "from-sky-500/10 to-sky-600/5" },
    { label: "Notes Created", val: stats?.total_notes || 0, icon: <FileText className="w-4 h-4 text-teal-500" />, pct: 70, bg: "from-teal-500/10 to-teal-600/5" },
    { label: "PDFs Uploaded", val: pdfs.length, icon: <BookOpen className="w-4 h-4 text-emerald-500" />, pct: 50, bg: "from-emerald-500/10 to-emerald-600/5" },
    { label: "AI Chats Count", val: chats.length, icon: <MessageSquare className="w-4 h-4 text-purple-500" />, pct: 65, bg: "from-purple-500/10 to-purple-600/5" },
    { label: "Quizzes Completed", val: stats?.completed_tasks || 0, icon: <FileBadge className="w-4 h-4 text-cyan-500" />, pct: 40, bg: "from-cyan-500/10 to-cyan-600/5" },
    { label: "Coding Challenges", val: 12, icon: <Code className="w-4 h-4 text-pink-500" />, pct: 55, bg: "from-pink-500/10 to-pink-600/5" },
    { label: "ATS Resume Score", val: resumes.length > 0 ? `${resumes[0].ats_score}%` : "88%", icon: <Briefcase className="w-4 h-4 text-rose-500" />, pct: 88, bg: "from-rose-500/10 to-rose-600/5" },
    { label: "Mock Recruiter", val: "Excellent", icon: <Activity className="w-4 h-4 text-violet-500" />, pct: 90, bg: "from-violet-500/10 to-violet-600/5" }
  ];

  // Subject distribution Pie Chart Mock data
  const pieData = [
    { name: "Coding Algorithms", value: 35, color: "#6366f1" },
    { name: "Cybersecurity CLI", value: 25, color: "#f43f5e" },
    { name: "Syllabus Notes", value: 25, color: "#10b981" },
    { name: "Assessment Tests", value: 15, color: "#a855f7" }
  ];

  // Contribution commits calendar cells mapping
  const commitDays = Array.from({ length: 84 }, (_, i) => {
    const val = Math.floor(Math.random() * 4);
    return {
      day: i,
      intensity: val === 0 ? "bg-slate-100 dark:bg-slate-900" : val === 1 ? "bg-indigo-500/20" : val === 2 ? "bg-indigo-500/50" : "bg-indigo-600"
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 w-full">
      
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-[20px] border border-white/5 bg-[#12131A] flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 bg-indigo-500/15 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400 select-none">
            {user?.avatar ? (
              user.avatar.startsWith("/") || user.avatar.startsWith("http") ? (
                <img src={user.avatar.startsWith("http") ? user.avatar : `${api.defaults.baseURL}${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl animate-float-robot">{user.avatar}</span>
              )
            ) : (
              user?.name.split(" ").map(w => w[0]).join("").toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-850 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {user?.name.split(" ")[0]}! <span className="animate-wave inline-block origin-[70%_70%]">👋</span></span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </h1>
            <p className="text-[10px] text-slate-450 italic mt-0.5">"{quote}"</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-right">
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">Today's Date</span>
            <strong className="text-[10px] text-slate-600 dark:text-slate-300 font-mono block">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </strong>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-2">
            <Link to="/ai" className="premium-button-primary">
              <MessageSquare className="w-3.5 h-3.5" /> Chat AI
            </Link>
            <Link to="/pdf" className="premium-button-secondary">
              <Upload className="w-3.5 h-3.5 text-indigo-500" /> Ingest PDF
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. KPI Cards Grid with Staggered Framer motion */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
      >
        {kpiStats.map((kpi, idx) => {
          const paths = [
            "M0,25 Q15,5 30,20 T60,8 T90,18",
            "M0,10 Q20,25 40,5 T80,18 T90,8",
            "M0,20 Q10,5 25,25 T55,10 T90,15",
            "M0,5 Q15,25 35,10 T65,22 T90,5",
            "M0,25 Q20,10 40,20 T70,5 T90,12",
            "M0,15 Q15,5 30,25 T60,10 T90,8"
          ];
          const sparkPath = paths[idx % paths.length];
          const sparkColor = idx % 3 === 0 ? "text-purple-500/40" : idx % 3 === 1 ? "text-amber-500/40" : "text-emerald-500/40";
          
          return (
            <motion.div
              variants={itemVariants}
              key={idx}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-[20px] border border-white/5 bg-[#181922] flex flex-col justify-between h-28 hover:border-purple-500/30 hover:shadow-[0_12px_30px_rgba(139,92,246,0.08)] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                {kpi.icon}
              </div>
              
              <div className="flex items-end justify-between gap-2 mt-2">
                <strong className="text-lg font-black block text-slate-900 dark:text-white leading-none">
                  {formatValueAndAnimate(kpi.val)}
                </strong>
                
                <svg className={`w-16 h-6 ${sparkColor} mb-0.5`} viewBox="0 0 100 30" fill="none">
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.1 }}
                    d={sparkPath}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="w-full h-1 bg-slate-850 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${kpi.pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full" 
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Main Chart & Goals Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recharts Analytics Tab Panel */}
        <div className="lg:col-span-8 p-6 rounded-[20px] border border-white/5 bg-[#12131A] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Analytics Dashboard
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: "hours", label: "Study Hours" },
                { id: "quizzes", label: "Quizzes" },
                { id: "notes", label: "Notes" },
                { id: "pie", label: "Allocation" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveChartTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                    activeChartTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {activeChartTab === "hours" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b15" />
                  <XAxis dataKey="day" style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: 12, border: "none", fontSize: 10 }} />
                  <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {activeChartTab === "quizzes" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b15" />
                  <XAxis dataKey="day" style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: 12, border: "none", fontSize: 10 }} />
                  <Line type="monotone" dataKey="quizzes" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {activeChartTab === "notes" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b15" />
                  <XAxis dataKey="day" style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis style={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: 12, border: "none", fontSize: 10 }} />
                  <Bar dataKey="notes" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {activeChartTab === "pie" && (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center h-full">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 px-6">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Challenge claim and insights card with floating Robot suggestions */}
        <div className="lg:col-span-4 p-6 rounded-[20px] border border-indigo-500/25 bg-[#181922] text-white relative flex flex-col justify-between gap-6 shadow-xl select-none">
          <div className="absolute top-[-20%] right-[-20%] w-48 h-48 rounded-full filter blur-[50px] bg-indigo-500/20 pointer-events-none" />

          {/* Flying Particles Emitter */}
          <AnimatePresence>
            {flyingParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 160,
                  y: -180 - Math.random() * 80,
                  scale: [0.8, 1.3, 0.5],
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 z-50 pointer-events-none text-xs font-black text-indigo-400 drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
              >
                {p.type === "xp" ? "✨ +50 XP" : "🪙 +10 Coins"}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Confetti Emitter */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
              {confettiParticles.map((cp) => (
                <motion.div
                  key={cp.id}
                  initial={{ x: cp.x + "%", y: "0%", scale: cp.scale, rotate: cp.rotation, opacity: 1 }}
                  animate={{
                    y: "100%",
                    rotate: cp.rotation + 360,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: cp.size,
                    height: cp.size,
                    backgroundColor: cp.color,
                    borderRadius: "50%",
                  }}
                />
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                🎯 Daily Challenge
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isAvailable ? "bg-indigo-500/20 text-indigo-300 animate-pulse" : "bg-emerald-500/20 text-emerald-300"}`}>
                  {isAvailable ? "ACTIVE" : "COMPLETED"}
                </span>
                <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm animate-bounce select-none border border-white/5">
                  <span>🤖</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight uppercase text-slate-200">Complete today's challenge</h4>
              <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                Solve exam planner tasks and study notes to secure Daily Challenge metrics rewards.
              </p>
            </div>

            {/* Reward Info Details */}
            <div className="bg-[#12131A] border border-white/5 rounded-[20px] p-3 flex justify-around text-center">
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase block">Challenge Reward</span>
                <span className="text-xs font-black text-indigo-400">+50 XP</span>
              </div>
              <div className="border-r border-white/5" />
              <div>
                <span className="text-[8px] text-slate-500 font-bold uppercase block">Bonus Coins</span>
                <span className="text-xs font-black text-yellow-500">+10 Coins</span>
              </div>
            </div>

            <div className="space-y-2 relative">
              <button
                onClick={handleClaimChallenge}
                disabled={!isAvailable || claiming}
                className={`w-full flex items-center justify-center gap-1.5 h-10 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all duration-300 cursor-pointer ${
                  !isAvailable
                    ? "bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 cursor-not-allowed"
                    : claiming
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "premium-button-primary shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] animate-pulse"
                }`}
              >
                {claiming ? (
                  <span>Processing...</span>
                ) : !isAvailable ? (
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Claimed Today</span>
                  </motion.div>
                ) : (
                  <span>Claim Reward</span>
                )}
              </button>

              {!isAvailable && countdownStr && (
                <div className="text-center text-[9px] font-extrabold text-slate-450 tracking-wider pt-1 flex items-center justify-center gap-1">
                  <span>Next reward available in</span>
                  <span className="font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">{countdownStr}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 block">AI Smart Insights</span>
            <div className="space-y-1.5">
              {(stats?.insights || ["Ingest one more PDF textbook page to unlock active timed quiz guides."]).slice(0, 2).map((ins, index) => (
                <div key={index} className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. GitHub Contribution Heatmap */}
      <section className="p-6 rounded-[20px] border border-white/5 bg-[#12131A] shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-500" /> Study Heatmap
          </h3>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">Activity Calendar (Last 12 Weeks)</span>
        </div>
        <div className="flex flex-wrap gap-1 items-center justify-center pt-2">
          {commitDays.map((c) => (
            <div
              key={c.day}
              className={`w-3.5 h-3.5 rounded ${c.intensity} hover:ring-2 hover:ring-indigo-500/40 transition-all`}
              title={`Day ${c.day + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 5. Continue Learning Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Latest Note */}
        <div className="p-5 rounded-[20px] border border-white/5 bg-[#12131A] flex flex-col justify-between h-40 shadow-xl">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-extrabold uppercase text-slate-450 tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-500" /> Active Note
              </span>
              <span className="text-[8px] text-slate-400 font-mono">Last Edited</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-3 truncate">
              {notes.length > 0 ? (notes[0].title || "Syllabus Notes Draft") : "Syllabus Notes Draft"}
            </h4>
            <p className="text-[9px] text-slate-450 mt-1 line-clamp-2">
              {notes.length > 0 ? (notes[0].content || "").substring(0, 80) : "Start writing notes and use markdown tools."}
            </p>
          </div>
          <Link to="/notes" className="w-full premium-button-secondary">
            Continue Note
          </Link>
        </div>

        {/* Latest PDF */}
        <div className="p-5 rounded-[20px] border border-white/5 bg-[#12131A] flex flex-col justify-between h-40 shadow-xl">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-extrabold uppercase text-slate-450 tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-sky-500" /> Textbook Upload
              </span>
              <span className="text-[8px] text-slate-400 font-mono">RAG Ingested</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-3 truncate">
              {pdfs.length > 0 ? (pdfs[0].filename || "Academic Textbook.pdf") : "Academic Textbook.pdf"}
            </h4>
            <p className="text-[9px] text-slate-450 mt-1">
              {pdfs.length > 0 ? `${(pdfs[0].extracted_text || "").substring(0, 80)}...` : "Load chapters to chat with outlines."}
            </p>
          </div>
          <Link to="/pdf" className="w-full premium-button-secondary">
            Ask Textbook
          </Link>
        </div>

        {/* Latest Resume ATS */}
        <div className="p-5 rounded-[20px] border border-white/5 bg-[#12131A] flex flex-col justify-between h-40 shadow-xl">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-extrabold uppercase text-slate-450 tracking-wider flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-rose-500" /> Resume Analyzer
              </span>
              <span className="text-[8px] text-emerald-500 font-bold">Latest Score</span>
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-3 truncate">
              {resumes.length > 0 ? resumes[0].target_role : "SDE Target Match"}
            </h4>
            <p className="text-[9px] text-slate-450 mt-1">
              ATS Score: <strong className="text-slate-700 dark:text-slate-200">{resumes.length > 0 ? resumes[0].ats_score : 88}%</strong>. Matched keywords and optimized sections.
            </p>
          </div>
          <Link to="/resume" className="w-full premium-button-secondary">
            Review ATS
          </Link>
        </div>

      </div>

      {/* 6. Quick Actions & Daily Goals checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Actions Panel */}
        <div className="lg:col-span-6 p-6 rounded-[20px] border border-white/5 bg-[#12131A] shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/5 pb-3">Quick Actions Shortcuts</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "New Study Note", to: "/notes", color: "hover:border-teal-500/20" },
              { label: "Scan Textbook PDF", to: "/pdf", color: "hover:border-sky-500/20" },
              { label: "Chat with AI Tutor", to: "/ai", color: "hover:border-purple-500/20" },
              { label: "Compile Code script", to: "/coding", color: "hover:border-emerald-500/20" },
              { label: "Symmetric Cipher terminal", to: "/cybersecurity", color: "hover:border-rose-500/20" },
              { label: "Mock Recruiter round", to: "/resume", color: "hover:border-violet-500/20" }
            ].map((act, i) => (
              <Link
                key={i}
                to={act.to}
                className="premium-button-secondary w-full"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>{act.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Daily Goals Checklist */}
        <div className="lg:col-span-6 p-6 rounded-[20px] border border-white/5 bg-[#12131A] shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Daily Goals Progress</h3>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">Tracker quotas</span>
          </div>
          <div className="space-y-4">
            {[
              { label: "Study Duration Goal", progress: 80, val: `${stats?.total_study_hours || 0} / 3 hrs` },
              { label: "Textbooks Reading Pages", progress: 50, val: `${pdfs.length} / 2 docs` },
              { label: "Compiler Code script check", progress: 100, val: "Completed" }
            ].map((goal, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-450 dark:text-slate-300">
                  <span>{goal.label}</span>
                  <span className="font-mono">{goal.val}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
