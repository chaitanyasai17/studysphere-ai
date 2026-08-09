import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  BarChart,
  Activity,
  Award,
  Clock,
  Flame,
  CheckSquare,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface SummaryStats {
  total_study_hours: number;
  current_streak: number;
  quiz_accuracy_pct: number;
  productivity_score: number;
  total_notes: number;
  completed_tasks: number;
  total_tasks: number;
  insights: string[];
}

interface HeatmapDay {
  date: string;
  count: number;
  level: number; // 0 to 4
}

interface ChartItem {
  date: string;
  day: string;
  hours: number;
  quizzes: number;
  notes: number;
}

export const ProgressAnalytics: React.FC = () => {
  const { addToast } = useNotifications();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [dateRange, setDateRange] = useState<"7days" | "30days">("30days");
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const [statsRes, heatmapRes, chartRes] = await Promise.all([
        api.get("/api/analytics/summary"),
        api.get("/api/analytics/streak"),
        api.get("/api/analytics/charts")
      ]);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data);
      setChartData(chartRes.data);
    } catch (e) {
      addToast("Error", "Could not load progress statistics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Heatmap color map levels
  const levelColors = [
    "bg-[#181922] border-white/5 text-slate-550", // level 0
    "bg-indigo-500/10 border-indigo-550/10 text-indigo-400/80", // level 1
    "bg-indigo-500/25 border-indigo-550/20 text-indigo-300", // level 2
    "bg-indigo-500/50 border-indigo-550/40 text-indigo-200", // level 3
    "bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-600/10" // level 4
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-4 select-none">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-850 dark:text-white">Progress Analytics</h1>
          <p className="text-[10px] text-slate-450 mt-1">Track study milestones and activity levels.</p>
        </div>

        {/* Date Filter selector */}
        <div className="flex bg-[#12131A] p-1 rounded-xl border border-white/5 text-[9px] font-black uppercase">
          <button
            onClick={() => {
              setDateRange("7days");
              addToast("Filtered", "Showing last 7 days study logs.", "info");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              dateRange === "7days" ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setDateRange("30days");
              addToast("Filtered", "Showing last 30 days study logs.", "info");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              dateRange === "30days" ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* KPI Stats summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl flex items-center justify-between hover:translate-y-[-2px] transition-transform">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Study Duration</span>
            <h3 className="text-xl font-black text-white">{stats?.total_study_hours || 0.0} Hours</h3>
          </div>
          <Clock className="w-8 h-8 text-indigo-400 bg-indigo-500/10 p-1.5 rounded-xl border border-indigo-500/15" />
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl flex items-center justify-between hover:translate-y-[-2px] transition-transform">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Current Streak</span>
            <h3 className="text-xl font-black text-white">{stats?.current_streak || 0} Days</h3>
          </div>
          <Flame className="w-8 h-8 text-orange-400 bg-orange-500/10 p-1.5 rounded-xl border border-orange-500/15" />
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl flex items-center justify-between hover:translate-y-[-2px] transition-transform">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Quiz Accuracy</span>
            <h3 className="text-xl font-black text-white">{stats?.quiz_accuracy_pct || 0}%</h3>
          </div>
          <Award className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/15" />
        </div>

        <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl flex items-center justify-between hover:translate-y-[-2px] transition-transform">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Productivity Score</span>
            <h3 className="text-xl font-black text-white">{stats?.productivity_score || 50}/100</h3>
          </div>
          <Activity className="w-8 h-8 text-sky-400 bg-sky-500/10 p-1.5 rounded-xl border border-sky-500/15" />
        </div>
      </div>

      {/* GitHub-style Heatmap widget (Linear Dashboard Style) */}
      <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4 select-none">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Study Streak Heatmap</h3>
          <span className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">Last 30 Days Activity Log</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            {heatmap.map((day) => (
              <div
                key={day.date}
                className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center text-[10px] font-bold transition-all hover:scale-110 ${levelColors[day.level]}`}
                title={`${day.date}: ${day.count} activity points`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>

          <div className="flex justify-between sm:justify-end items-center gap-2 text-[9px] text-slate-500 font-bold uppercase">
            <span>Less</span>
            <div className="w-4 h-4 rounded bg-[#181922] border border-white/5" />
            <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-550/10" />
            <div className="w-4 h-4 rounded bg-indigo-500/25 border border-indigo-550/20" />
            <div className="w-4 h-4 rounded bg-indigo-500/50 border border-indigo-550/40" />
            <div className="w-4 h-4 rounded bg-indigo-650 border border-indigo-500" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Recharts Activity graph & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recharts chart (Left 8 columns) */}
        <div className="lg:col-span-8 p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4 select-none">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <BarChart className="w-4 h-4 text-indigo-400" /> Weekly Activity metrics
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 11, 16, 0.95)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    fontSize: 9,
                    color: "#fff"
                  }}
                />
                <Legend style={{ fontSize: 9, fontWeight: "bold" }} />
                <Bar dataKey="quizzes" name="Quizzes Done" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
                <Bar dataKey="notes" name="Notes Written" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI study advisor insights (Right 4 columns) */}
        <div className="lg:col-span-4 p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Lightbulb className="w-4.5 h-4.5 text-amber-400 animate-pulse" /> Advisor Insights
          </h4>

          <div className="flex flex-col gap-4 select-text">
            {(stats?.insights || ["Begin study sessions to generate insights."]).map((ins, index) => (
              <div key={index} className="p-3.5 rounded-2xl border-l-2 border-amber-500 bg-[#181922] text-[10.5px] text-slate-350 leading-relaxed hover:bg-[#1f202b] transition-colors">
                {ins}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
