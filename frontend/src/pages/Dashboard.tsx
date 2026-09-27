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
  Plus,
  PlayCircle,
  Brain,
  Layers,
  ChevronRight,
  Terminal,
  Target
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
    <div className="space-y-8 max-w-7xl mx-auto p-6 w-full text-white">
      <div className="flex flex-col md:flex-row justify-between gap-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 bg-white/[0.06] rounded w-64" />
          <div className="h-4 bg-white/[0.06] rounded w-48" />
        </div>
        <div className="h-10 bg-white/[0.06] rounded-full w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="h-32 bg-[#161625] border border-white/[0.06] rounded-2xl p-5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-[#161625] border border-white/[0.06] rounded-2xl p-6" />
          <div className="h-72 bg-[#161625] border border-white/[0.06] rounded-2xl p-6" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-[#161625] border border-white/[0.06] rounded-2xl p-6" />
          <div className="h-48 bg-[#161625] border border-white/[0.06] rounded-2xl p-6" />
        </div>
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

export const Dashboard: React.FC = () => {
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

      addToast("🎉 Daily Challenge Completed", `You earned +50 XP and +10 Coins!`, "success");

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

        syncStats(res.data.total_xp, res.data.total_coins, true);
      }

      try {
        await api.post("/api/notifications/trigger");
      } catch (err) {
        console.error(err);
      }

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

  const pieData = [
    { name: "Coding Algorithms", value: 35, color: "#8B5CF6" },
    { name: "Cybersecurity CLI", value: 25, color: "#3B82F6" },
    { name: "Syllabus Notes", value: 25, color: "#10B981" },
    { name: "Assessment Tests", value: 15, color: "#06B6D4" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto p-6 w-full text-white"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Keep learning, keep building. You're doing great!</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[#161625] border border-white/[0.06] rounded-full px-4 py-2 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-sm">{stats?.current_streak || 0} Day Streak</span>
          </div>
          <div className="flex gap-2">
             <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-xl text-sm font-bold border border-purple-500/20">{profile?.xp_points || 0} XP</span>
             <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-xl text-sm font-bold border border-yellow-500/20">🪙 {profile?.coins || 0}</span>
             <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl text-sm font-bold border border-emerald-500/20">Lvl {profile?.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Learning Progress */}
        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white"><CountUp end={stats?.productivity_score || 75} />%</div>
          <div className="text-xs text-slate-400 mt-1">Learning Progress</div>
        </div>

        {/* Topics Completed */}
        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white"><CountUp end={stats?.total_notes || 12} /></div>
          <div className="text-xs text-slate-400 mt-1">Topics Completed</div>
        </div>

        {/* Quizzes Taken */}
        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white"><CountUp end={stats?.completed_tasks || 8} /></div>
          <div className="text-xs text-slate-400 mt-1">Quizzes Taken</div>
        </div>

        {/* Projects Built */}
        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white"><CountUp end={resumes.length || 3} /></div>
          <div className="text-xs text-slate-400 mt-1">Projects Built</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Learning Card */}
          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm text-slate-400 font-medium">Continue Learning</h3>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {notes.length > 0 ? notes[0].title : "Advanced System Design"}
                  </h2>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="w-48 h-2 bg-[#0f0f1a] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-purple-500 w-[65%]" />
                    </div>
                    <span className="text-sm text-slate-400 font-medium">65%</span>
                  </div>
                </div>
              </div>
              <Link to="/notes" className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl px-6 py-2.5 font-semibold transition-all duration-300 flex items-center gap-2 w-fit shrink-0">
                Continue Learning <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Learning Activity</h2>
              <div className="flex gap-2">
                {["hours", "quizzes", "notes", "pie"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeChartTab === tab 
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {activeChartTab === "hours" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#161625", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} itemStyle={{ color: "#8B5CF6" }} />
                    <Area type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {activeChartTab === "quizzes" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#161625", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} itemStyle={{ color: "#06B6D4" }} />
                    <Line type="monotone" dataKey="quizzes" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, fill: "#161625", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {activeChartTab === "notes" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis style={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#161625", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} itemStyle={{ color: "#10B981" }} />
                    <Bar dataKey="notes" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {activeChartTab === "pie" && (
                <div className="flex items-center justify-center h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#161625", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Daily Challenge */}
          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
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
                  className="absolute left-1/2 top-1/2 z-50 pointer-events-none text-xs font-black text-purple-400 drop-shadow-[0_2px_8px_rgba(139,92,246,0.5)]"
                >
                  {p.type === "xp" ? "✨ +50 XP" : "🪙 +10 Coins"}
                </motion.div>
              ))}
            </AnimatePresence>

            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
                {confettiParticles.map((cp) => (
                  <motion.div
                    key={cp.id}
                    initial={{ x: cp.x + "%", y: "0%", scale: cp.scale, rotate: cp.rotation, opacity: 1 }}
                    animate={{ y: "100%", rotate: cp.rotation + 360, opacity: [1, 1, 0] }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    style={{ position: "absolute", width: cp.size, height: cp.size, backgroundColor: cp.color, borderRadius: "50%" }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" /> Daily Challenge
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isAvailable ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                {isAvailable ? "ACTIVE" : "DONE"}
              </span>
            </div>

            <p className="text-sm text-slate-400 mb-6">Complete your daily learning activities to earn XP and coins.</p>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-[#0f0f1a] rounded-xl p-3 border border-white/[0.04] text-center">
                <div className="text-purple-400 font-bold mb-1">+50 XP</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reward</div>
              </div>
              <div className="flex-1 bg-[#0f0f1a] rounded-xl p-3 border border-white/[0.04] text-center">
                <div className="text-yellow-500 font-bold mb-1">+10 Coins</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Bonus</div>
              </div>
            </div>

            <button
              onClick={handleClaimChallenge}
              disabled={!isAvailable || claiming}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                !isAvailable
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-not-allowed"
                  : claiming
                    ? "bg-[#0f0f1a] text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              }`}
            >
              {claiming ? "Processing..." : !isAvailable ? <><CheckCircle className="w-5 h-5" /> Claimed Today</> : "Claim Reward"}
            </button>
            
            {!isAvailable && countdownStr && (
              <div className="text-center text-xs text-slate-500 mt-4">
                Next reward in <span className="text-emerald-400 font-mono">{countdownStr}</span>
              </div>
            )}
          </div>

          {/* Today's Goals */}
          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Today's Goals</h2>
              <span className="text-sm font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">3/4 Completed</span>
            </div>
            
            <div className="space-y-4">
              {[
                { label: "Complete AI Notes", done: true },
                { label: "Take a quiz", done: true },
                { label: "Practice coding", done: true },
                { label: "Read cybersecurity article", done: false }
              ].map((task, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  task.done 
                    ? "bg-[#0f0f1a] border-white/[0.02] opacity-70" 
                    : "bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30"
                }`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    task.done ? "bg-purple-500 text-white" : "border-2 border-slate-600"
                  }`}>
                    {task.done && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-sm font-medium ${task.done ? "text-slate-500 line-through" : "text-slate-200"}`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/ai" className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-1">AI Tutor</h3>
            <p className="text-xs text-slate-400 mb-4">Chat with your personalized AI tutor</p>
            <div className="text-sm text-purple-400 font-semibold flex items-center gap-1">Go <ChevronRight className="w-4 h-4" /></div>
          </Link>
          
          <Link to="/pdf" className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-1">Upload PDF</h3>
            <p className="text-xs text-slate-400 mb-4">Extract insights from textbooks</p>
            <div className="text-sm text-blue-400 font-semibold flex items-center gap-1">Go <ChevronRight className="w-4 h-4" /></div>
          </Link>
          
          <Link to="/quiz" className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-1">Generate Quiz</h3>
            <p className="text-xs text-slate-400 mb-4">Test your knowledge dynamically</p>
            <div className="text-sm text-cyan-400 font-semibold flex items-center gap-1">Go <ChevronRight className="w-4 h-4" /></div>
          </Link>
          
          <Link to="/coding" className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-1">Coding Playground</h3>
            <p className="text-xs text-slate-400 mb-4">Practice algorithmic challenges</p>
            <div className="text-sm text-emerald-400 font-semibold flex items-center gap-1">Go <ChevronRight className="w-4 h-4" /></div>
          </Link>
        </div>
      </div>

    </motion.div>
  );
};
