import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  BarChart,
  Activity,
  Award,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Sparkles,
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
import { motion } from "framer-motion";

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
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const levelColors = [
    "bg-[#0f0f1a] border-white/[0.06] text-slate-500", 
    "bg-purple-500/10 border-purple-500/20 text-purple-400", 
    "bg-purple-500/30 border-purple-500/40 text-purple-300", 
    "bg-purple-500/60 border-purple-500/70 text-purple-200", 
    "bg-purple-500 border-purple-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart className="w-6 h-6 text-purple-500" /> Progress Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track study milestones and activity levels.</p>
        </div>

        <div className="flex bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => {
              setDateRange("7days");
              addToast("Filtered", "Showing last 7 days study logs.", "info");
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              dateRange === "7days" ? "bg-white/[0.05] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => {
              setDateRange("30days");
              addToast("Filtered", "Showing last 30 days study logs.", "info");
            }}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              dateRange === "30days" ? "bg-white/[0.05] text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-400">Study Hours</span>
            <h3 className="text-2xl font-bold text-white">{stats?.total_study_hours || 0.0}</h3>
          </div>
          <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-400">Current Streak</span>
            <h3 className="text-2xl font-bold text-white">{stats?.current_streak || 0}</h3>
          </div>
          <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
        </div>

        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-400">Quiz Accuracy</span>
            <h3 className="text-2xl font-bold text-white">{stats?.quiz_accuracy_pct || 0}%</h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
            <Target className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-400">Productivity Score</span>
            <h3 className="text-2xl font-bold text-white">{stats?.productivity_score || 50}</h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">30-Day Activity</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
            {heatmap.map((day) => (
              <div
                key={day.date}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${levelColors[day.level]}`}
                title={`${day.date}: ${day.count} activity points`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>

          <div className="flex justify-between sm:justify-end items-center gap-2 text-xs text-slate-400 font-semibold">
            <span>Less</span>
            <div className="w-4 h-4 rounded-md bg-[#0f0f1a] border border-white/[0.06]" />
            <div className="w-4 h-4 rounded-md bg-purple-500/10 border border-purple-500/20" />
            <div className="w-4 h-4 rounded-md bg-purple-500/30 border border-purple-500/40" />
            <div className="w-4 h-4 rounded-md bg-purple-500/60 border border-purple-500/70" />
            <div className="w-4 h-4 rounded-md bg-purple-500 border border-purple-400" />
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-6">Weekly Metrics</h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "#94A3B8" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161625",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#fff"
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="quizzes" name="Quizzes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="notes" name="Notes" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 flex flex-col">
          <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-400" /> AI Insights
          </h4>

          <div className="flex flex-col gap-4 flex-grow">
            {stats?.insights?.length ? (
              stats.insights.map((ins, index) => (
                <div key={index} className="p-4 rounded-xl border-l-2 border-purple-500 bg-[#0f0f1a] text-sm text-slate-400">
                  {ins}
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border-l-2 border-purple-500 bg-[#0f0f1a] text-sm text-slate-400">
                Begin study sessions to generate insights.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
