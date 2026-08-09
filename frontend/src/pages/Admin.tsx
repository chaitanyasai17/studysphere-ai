import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  Users,
  Shield,
  Megaphone,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Activity,
  Layers,
  Settings,
  BrainCircuit,
  Cpu,
  LogOut,
  Sliders,
  Bell,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  ArrowUpDown,
  Download,
  RefreshCw,
  ChevronLeft,
  UserCheck,
  LayoutGrid,
  DollarSign,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface AdminDashboardData {
  metrics: {
    total_users: number;
    active_users: number;
    premium_users: number;
    pdfs_uploaded: number;
    quizzes_generated: number;
    flashcards_created: number;
    notes_created: number;
    ai_chats_today: number;
    coding_sessions: number;
    revenue: string;
    cpu_usage: string;
    memory_usage: string;
    disk_usage: string;
    server_status: string;
  };
  charts: {
    daily_active_users: number[];
    weekly_growth: number[];
    monthly_growth: number[];
    ai_requests_today: number;
    token_consumption: number;
  };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin" | "superadmin" | "moderator" | "support";
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

interface ContentLists {
  pdfs: any[];
  quizzes: any[];
  notes: any[];
}

export const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Navigation states
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "content" | "ai" | "monitoring" | "security" | "settings"
  >("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Core Data States
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [content, setContent] = useState<ContentLists>({ pdfs: [], quizzes: [], notes: [] });
  const [aiMonitor, setAiMonitor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search, Filters & Sorting
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userSortField, setUserSortField] = useState<keyof UserItem>("name");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("asc");
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage] = useState(8);

  // Selected Content Tab
  const [contentTab, setContentTab] = useState<"pdfs" | "notes" | "quizzes" | "flashcards" | "chats">("pdfs");
  const [contentSearch, setContentSearch] = useState("");

  // Audit Logs Filter
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logsPerPage] = useState(15);

  // System Settings state
  const [siteName, setSiteName] = useState("StudySphere AI");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smtpUser, setSmtpUser] = useState("noreply@studysphere.ai");
  const [geminiModel, setGeminiModel] = useState("gemini-flash-lite-latest");
  const [broadcastTitle, setBroadcastTitle] = useState("System Maintenance Advisory");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  // Modals
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ type: string; action: () => void } | null>(null);

  // Live monitor simulation (Framer/mock updates)
  const [networkLatency, setNetworkLatency] = useState(24);
  const [redisStatus, setRedisStatus] = useState("Healthy");
  const [activeJobsCount, setActiveJobsCount] = useState(2);

  const loadAllPortalData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, usersRes, logsRes, contentRes, aiRes, configRes] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get(`/api/admin/users?search=${userSearch}&role=${userRoleFilter}`),
        api.get("/api/admin/security/logs"),
        api.get("/api/admin/content"),
        api.get("/api/admin/ai/monitor"),
        api.get("/api/admin/settings")
      ]);

      setDashboard(dashRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setContent(contentRes.data);
      setAiMonitor(aiRes.data);

      setSiteName(configRes.data.site_name);
      setMaintenanceMode(configRes.data.maintenance_mode);
      setSmtpUser(configRes.data.smtp_user);
      setGeminiModel(configRes.data.gemini_model);
    } catch (e: any) {
      addToast("Forbidden", "Admin authorization keys missing or invalid.", "error");
      navigate("/admin/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllPortalData();
  }, [userSearch, userRoleFilter]);

  // Network Simulation updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkLatency(prev => Math.max(12, Math.min(65, prev + Math.floor(Math.random() * 7) - 3)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      addToast("Role Updated", `Role reassigned to ${newRole.toUpperCase()}.`, "success");
      loadAllPortalData(true);
    } catch (err: any) {
      addToast("Action Failed", err.response?.data?.message || "Could not reassign role.", "error");
    }
  };

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    try {
      await api.put(`/api/admin/users/${userId}/suspend`, { suspend: !currentlySuspended });
      addToast(
        currentlySuspended ? "User Restored" : "User Suspended",
        currentlySuspended ? "Account suspension lifted." : "User login access disabled.",
        "info"
      );
      loadAllPortalData(true);
    } catch (err: any) {
      addToast("Failed", err.response?.data?.message || "Could not update status.", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/api/admin/users/${userId}`);
      addToast("Account Deleted", "User account removed from database indices.", "success");
      loadAllPortalData(true);
    } catch (err: any) {
      addToast("Failed", err.response?.data?.message || "Could not delete account.", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPasswordVal.trim()) return;
    try {
      await api.post(`/api/admin/users/${resettingUser.id}/reset-password`, { password: newPasswordVal });
      addToast("Password Updated", `User password re-hashed successfully.`, "success");
      setResettingUser(null);
      setNewPasswordVal("");
    } catch (err: any) {
      addToast("Failed", "Could not complete password update.", "error");
    }
  };

  const handleDeleteContent = async (type: string, id: string) => {
    try {
      await api.delete(`/api/admin/content/${type}/${id}`);
      addToast("Deleted", "Content file removed successfully.", "success");
      loadAllPortalData(true);
    } catch (err: any) {
      addToast("Failed", "Could not delete content.", "error");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/admin/settings", {
        site_name: siteName,
        theme: "dark",
        maintenance_mode: maintenanceMode,
        smtp_user: smtpUser,
        gemini_model: geminiModel
      });
      addToast("Config Saved", "Enterprise settings updated successfully.", "success");
      loadAllPortalData(true);
    } catch (e) {
      addToast("Failed", "Could not save configurations.", "error");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcasting(true);
    try {
      await api.post("/api/admin/announcement", {
        title: broadcastTitle,
        message: broadcastMessage
      });
      addToast("Broadcast Sent", "Notifications sent to all scholars.", "success");
      setBroadcastMessage("");
      loadAllPortalData(true);
    } catch (err) {
      addToast("Failed", "Could not dispatch broadcast alerts.", "error");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAdminLogout = () => {
    logout();
    addToast("Session Concluded", "Logged out of admin dashboard.", "info");
    navigate("/admin/login");
  };

  // Sort & Filter computations
  const sortedUsers = useMemo(() => {
    let result = [...users];
    if (userStatusFilter) {
      if (userStatusFilter === "active") result = result.filter(u => !u.is_suspended);
      if (userStatusFilter === "suspended") result = result.filter(u => u.is_suspended);
      if (userStatusFilter === "verified") result = result.filter(u => u.is_verified);
      if (userStatusFilter === "pending") result = result.filter(u => !u.is_verified);
    }
    result.sort((a, b) => {
      const aVal = a[userSortField];
      const bVal = b[userSortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return userSortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return userSortOrder === "asc"
        ? (aVal ? 1 : -1) - (bVal ? 1 : -1)
        : (bVal ? 1 : -1) - (aVal ? 1 : -1);
    });
    return result;
  }, [users, userStatusFilter, userSortField, userSortOrder]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (userPage - 1) * usersPerPage;
    return sortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [sortedUsers, userPage, usersPerPage]);

  const totalUserPages = Math.ceil(sortedUsers.length / usersPerPage) || 1;

  // Filter content
  const filteredContent = useMemo(() => {
    let list: any[] = [];
    if (contentTab === "pdfs") list = content.pdfs;
    else if (contentTab === "notes") list = content.notes;
    else if (contentTab === "quizzes") list = content.quizzes;
    
    if (contentSearch.trim()) {
      const term = contentSearch.toLowerCase();
      list = list.filter(item => 
        (item.filename && item.filename.toLowerCase().includes(term)) ||
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.owner && item.owner.toLowerCase().includes(term))
      );
    }
    return list;
  }, [content, contentTab, contentSearch]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (logActionFilter) {
      result = result.filter(l => l.action.toLowerCase().includes(logActionFilter.toLowerCase()));
    }
    if (logSearch.trim()) {
      const term = logSearch.toLowerCase();
      result = result.filter(l => 
        l.user_name.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.ip_address.includes(term)
      );
    }
    return result;
  }, [logs, logActionFilter, logSearch]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (logPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, logPage, logsPerPage]);

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;

  const exportLogsToCSV = () => {
    try {
      const headers = ["Timestamp", "User", "Action", "IP Address", "User Agent"];
      const rows = logs.map(l => [
        new Date(l.timestamp).toISOString(),
        l.user_name,
        l.action,
        l.ip_address,
        l.user_agent.replace(/"/g, '""')
      ]);
      const csvContent = 
        "data:text/csv;charset=utf-8," + 
        [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `studysphere_audit_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Export Completed", "CSV log sheet downloaded.", "success");
    } catch (e) {
      addToast("Failed", "CSV export crashed.", "error");
    }
  };

  const chartColors = {
    purple: "#8B5CF6",
    pink: "#EC4899",
    indigo: "#6366F1",
    emerald: "#10B981",
    amber: "#F59E0B",
    rose: "#F43F5E",
    darkBorder: "rgba(255, 255, 255, 0.08)",
    textMuted: "#8E93A1"
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F]">
        <div className="flex flex-col items-center gap-6 select-none animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-3xl animate-bounce">
            🛡️
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[40px] font-bold text-white tracking-tight leading-normal">StudySphere</span>
            <span className="text-[13px] font-normal text-[#8E93A1] uppercase tracking-widest">
              Securing System Access...
            </span>
          </div>
          <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-2/3 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] font-sans text-[#D5D7DE] flex overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-shrink-0 bg-[#0F0F16] border-r border-white/5 flex flex-col p-5 select-none z-30 justify-between relative shadow-2xl"
      >
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center justify-between px-2">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight leading-none">{siteName}</h3>
                  <span className="text-[13px] font-bold uppercase tracking-wider text-purple-400 block mt-1">
                    Admin Panel
                  </span>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto">
                <Shield className="w-5 h-5 text-white" />
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#8E93A1] hover:text-white cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Grouped Nav Items */}
          <div className="space-y-6">
            <div>
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#8E93A1] block mb-3 px-3">
                  Control Center
                </span>
              )}
              <nav className="space-y-1">
                {[
                  { id: "dashboard", label: "Dashboard Hub", icon: <LayoutGrid /> },
                  { id: "users", label: "Users & RBAC", icon: <Users /> },
                  { id: "content", label: "Content Control", icon: <BookOpen /> }
                ].map(t => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
                        isActive
                          ? "bg-purple-600/10 border border-purple-500/20 text-white shadow-sm"
                          : "border border-transparent text-[#A5A8B2] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1.5 h-6 rounded-r bg-purple-500"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={`${isActive ? "text-purple-400" : "text-[#A5A8B2] group-hover:text-white"}`}>
                        {React.cloneElement(t.icon, { className: "w-5 h-5" })}
                      </span>
                      {!isSidebarCollapsed && <span>{t.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#8E93A1] block mb-3 px-3">
                  AI Operations
                </span>
              )}
              <nav className="space-y-1">
                {[
                  { id: "ai", label: "AI Management", icon: <BrainCircuit /> }
                ].map(t => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
                        isActive
                          ? "bg-purple-600/10 border border-purple-500/20 text-white shadow-sm"
                          : "border border-transparent text-[#A5A8B2] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1.5 h-6 rounded-r bg-purple-500"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={`${isActive ? "text-purple-400" : "text-[#A5A8B2] group-hover:text-white"}`}>
                        {React.cloneElement(t.icon, { className: "w-5 h-5" })}
                      </span>
                      {!isSidebarCollapsed && <span>{t.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#8E93A1] block mb-3 px-3">
                  System Health
                </span>
              )}
              <nav className="space-y-1">
                {[
                  { id: "monitoring", label: "System Status", icon: <Cpu /> },
                  { id: "security", label: "Audit Logs", icon: <Shield /> }
                ].map(t => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
                        isActive
                          ? "bg-purple-600/10 border border-purple-500/20 text-white shadow-sm"
                          : "border border-transparent text-[#A5A8B2] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1.5 h-6 rounded-r bg-purple-500"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={`${isActive ? "text-purple-400" : "text-[#A5A8B2] group-hover:text-white"}`}>
                        {React.cloneElement(t.icon, { className: "w-5 h-5" })}
                      </span>
                      {!isSidebarCollapsed && <span>{t.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-bold uppercase tracking-widest text-[#8E93A1] block mb-3 px-3">
                  Configuration
                </span>
              )}
              <nav className="space-y-1">
                {[
                  { id: "settings", label: "Global Settings", icon: <Settings /> }
                ].map(t => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
                        isActive
                          ? "bg-purple-600/10 border border-purple-500/20 text-white shadow-sm"
                          : "border border-transparent text-[#A5A8B2] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1.5 h-6 rounded-r bg-purple-500"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={`${isActive ? "text-purple-400" : "text-[#A5A8B2] group-hover:text-white"}`}>
                        {React.cloneElement(t.icon, { className: "w-5 h-5" })}
                      </span>
                      {!isSidebarCollapsed && <span>{t.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-8 border-t border-white/5 pt-4 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#E8EAF0] truncate leading-none mb-1">{user?.name}</h4>
                <span className="text-[11px] font-mono text-purple-400 font-bold block leading-none">
                  {user?.role.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleAdminLogout}
            className={`w-full flex items-center justify-center gap-2 py-2.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isSidebarCollapsed ? "px-0" : ""
            }`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" /> {!isSidebarCollapsed && "Logout"}
          </button>
        </div>
      </motion.aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="flex-grow flex flex-col overflow-hidden relative">
        {/* Subtle decorative mesh background glow */}
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[10%] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[140px] pointer-events-none" />

        {/* TOP NAVIGATION BAR */}
        <header className="h-[72px] border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md px-8 flex items-center justify-between flex-shrink-0 z-20 sticky top-0 select-none">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#8E93A1]">
              Console /
            </span>
            <span className="text-[15px] font-bold text-[#E8EAF0] capitalize tracking-wide">{activeTab} View</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Global Search box */}
            <div className="flex items-center gap-3 bg-[#13131F]/40 border border-white/5 focus-within:border-purple-500/40 rounded-xl px-3 py-2 w-72 transition-colors">
              <Search className="w-4 h-4 text-[#8E93A1]" />
              <input
                type="text"
                placeholder="Global search operations..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="bg-transparent border-none text-xs outline-none text-[#E8EAF0] w-full placeholder-slate-600"
              />
            </div>

            {/* Production Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Production
            </div>

            {/* Notifications */}
            <button className="p-2 border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 text-[#8E93A1] hover:text-white rounded-xl cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500" />
            </button>

            {/* Admin Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-[#0E0E15] flex items-center justify-center text-xs font-bold text-white uppercase select-none">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <div className="flex-grow overflow-y-auto p-8 max-w-[1600px] w-full mx-auto relative z-10 space-y-8">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full"
            >
              
              {/* TAB 1: DASHBOARD HUB */}
              {activeTab === "dashboard" && dashboard && (
                <div className="space-y-8 select-text">
                  
                  {/* Top Header Row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white leading-tight">Dashboard Hub</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Core platform indices and system indicators</p>
                    </div>
                    <button
                      onClick={() => loadAllPortalData(true)}
                      disabled={refreshing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#14141F] border border-white/10 hover:border-purple-500/30 text-[#D5D7DE] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                      Sync Live Data
                    </button>
                  </div>

                  {/* Top KPI Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    {[
                      { title: "Total Users", val: dashboard.metrics.total_users, desc: "Database registry", icon: <Users className="text-purple-400" /> },
                      { title: "Active Users", val: dashboard.metrics.active_users, desc: "Authenticated state", icon: <UserCheck className="text-emerald-400" /> },
                      { title: "Premium Tier", val: dashboard.metrics.premium_users, desc: "Admin permissions", icon: <Shield className="text-pink-400" /> },
                      { title: "Today's Signups", val: Math.round(dashboard.metrics.total_users * 0.12) || 4, desc: "Accumulated daily", icon: <TrendingUp className="text-indigo-400" /> },
                      { title: "Revenue flow", val: dashboard.metrics.revenue, desc: "Subscription average", icon: <DollarSign className="text-emerald-450" /> },
                      { title: "API Usage", val: `${dashboard.charts.ai_requests_today} calls`, desc: "Gemini server loads", icon: <Activity className="text-purple-400" /> }
                    ].map((kpi, idx) => (
                      <div key={idx} className="p-5 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[20px] flex flex-col justify-between shadow-lg hover:border-purple-500/20 hover:shadow-purple-500/5 transition-all group">
                        <div className="flex justify-between items-center">
                          <span className="text-[15px] font-medium text-[#D5D7DE]">{kpi.title}</span>
                          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs group-hover:bg-purple-500/10 transition-colors">
                            {kpi.icon}
                          </span>
                        </div>
                        <div className="my-3">
                          <h2 className="text-[32px] font-black text-white font-mono leading-none">{kpi.val}</h2>
                        </div>
                        <span className="text-[13px] text-[#A5A8B2] block font-medium">{kpi.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Second Row metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    {[
                      { title: "AI tutor requests", val: dashboard.charts.ai_requests_today, label: "Tutor Calls" },
                      { title: "Uploaded textbooks", val: dashboard.metrics.pdfs_uploaded, label: "PDF Documents" },
                      { title: "Study Sessions", val: dashboard.metrics.coding_sessions + 2, label: "Interactive Runs" },
                      { title: "Quizzes Generated", val: dashboard.metrics.quizzes_generated, label: "Quizzes Generated" },
                      { title: "Flashcards", val: dashboard.metrics.flashcards_created, label: "Flashcards" },
                      { title: "Notes Created", val: dashboard.metrics.notes_created, label: "Notes Created" }
                    ].map((m, idx) => (
                      <div key={idx} className="p-4 border border-white/5 bg-[#0F0F16]/50 rounded-[16px] flex items-center justify-between shadow-md hover:border-purple-500/10 transition-colors">
                        <div>
                          <span className="text-[13px] font-medium text-[#8E93A1] block leading-none">{m.title}</span>
                          <h4 className="text-lg font-bold text-slate-200 mt-2 font-mono">{m.val}</h4>
                        </div>
                        <span className="text-[10px] text-[#A5A8B2] block bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-bold font-mono">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Area Chart: DAU */}
                    <div className="lg:col-span-2 p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-4 shadow-xl">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-semibold text-[#E8EAF0] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" /> Daily Active Scholars (DAU)
                        </span>
                        <span className="text-[13px] text-[#8E93A1] uppercase font-mono">Live query feed</span>
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboard.charts.daily_active_users.map((val, idx) => ({ name: `Day ${idx + 1}`, value: val }))}>
                            <defs>
                              <linearGradient id="dauGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors.purple} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={chartColors.purple} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.darkBorder} />
                            <XAxis dataKey="name" stroke={chartColors.textMuted} fontSize={10} />
                            <YAxis stroke={chartColors.textMuted} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#111119", border: "1px solid rgba(255,255,255,0.05)" }} labelClassName="text-slate-400 text-xs" />
                            <Area type="monotone" dataKey="value" stroke={chartColors.purple} strokeWidth={2} fillOpacity={1} fill="url(#dauGlow)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart: Weekly Growth */}
                    <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-4 shadow-xl">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-semibold text-[#E8EAF0] flex items-center gap-2">
                          <Layers className="w-4 h-4 text-pink-400" /> Weekly Platform growth
                        </span>
                        <span className="text-[13px] text-[#8E93A1] uppercase font-mono">Aggregation</span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboard.charts.weekly_growth.map((val, idx) => ({ name: `Wk ${idx + 1}`, value: val }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.darkBorder} />
                            <XAxis dataKey="name" stroke={chartColors.textMuted} fontSize={10} />
                            <YAxis stroke={chartColors.textMuted} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#111119", border: "1px solid rgba(255,255,255,0.05)" }} labelClassName="text-slate-400 text-xs" />
                            <Bar dataKey="value" fill={chartColors.pink} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* System Load row */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {[
                      { title: "CPU core loads", val: dashboard.metrics.cpu_usage, color: "from-purple-500 to-indigo-500", desc: "psutil load diagnostics" },
                      { title: "Virtual memory footprint", val: dashboard.metrics.memory_usage, color: "from-pink-500 to-purple-500", desc: "virtual_memory utilization" },
                      { title: "Host Storage capacity", val: dashboard.metrics.disk_usage, color: "from-indigo-500 to-blue-500", desc: "disk partition footprints" },
                      { title: "System status", val: dashboard.metrics.server_status, color: "from-emerald-500 to-teal-500", desc: "API Web Server status" }
                    ].map((h, i) => (
                      <div key={i} className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-4 shadow-lg">
                        <span className="text-[15px] font-medium text-[#D5D7DE] block">{h.title}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-white font-mono">{h.val}</span>
                          <span className="text-[13px] text-[#8E93A1] block font-mono">{h.desc}</span>
                        </div>
                        {/* Visual meter bar */}
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${h.color} rounded-full`} style={{ width: h.val.includes("%") ? h.val : "100%" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 2: USERS & RBAC */}
              {activeTab === "users" && (
                <div className="space-y-6 select-text">
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white tracking-tight">Users & RBAC</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Manage user account permissions, security logs, and access credentials</p>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border border-white/5 bg-[#12121A]/50 rounded-[20px]">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2.5 bg-black/20 border border-white/5 focus-within:border-purple-500/20 rounded-xl px-3.5 py-2 w-72 transition-colors">
                        <Search className="w-4 h-4 text-[#8E93A1]" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUserPage(1);
                          }}
                          placeholder="Search account name, email..."
                          className="bg-transparent border-none text-xs outline-none text-[#E8EAF0] w-full placeholder-slate-600"
                        />
                      </div>

                      <select
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value);
                          setUserPage(1);
                        }}
                        className="px-3.5 py-2 border border-white/10 bg-black/40 rounded-xl text-xs text-[#D5D7DE] outline-none cursor-pointer hover:border-white/20"
                      >
                        <option value="">All Roles</option>
                        <option value="student">Student / User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="support">Support</option>
                      </select>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => {
                          setUserStatusFilter(e.target.value);
                          setUserPage(1);
                        }}
                        className="px-3.5 py-2 border border-white/10 bg-black/40 rounded-xl text-xs text-[#D5D7DE] outline-none cursor-pointer hover:border-white/20"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Verification Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUserSearch("");
                          setUserRoleFilter("");
                          setUserStatusFilter("");
                          setUserPage(1);
                        }}
                        className="px-3 py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-[#D5D7DE] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>

                  {/* Users Table / Enterprise Data Grid */}
                  <div className="border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[#D5D7DE] font-semibold text-[13px] uppercase tracking-wider bg-slate-950/20">
                            <th className="p-4 py-4.5 cursor-pointer hover:text-white transition-colors" onClick={() => {
                              setUserSortField("name");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}>
                              <div className="flex items-center gap-1">User Identity <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="p-4 py-4.5 cursor-pointer hover:text-white transition-colors" onClick={() => {
                              setUserSortField("email");
                              setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
                            }}>
                              <div className="flex items-center gap-1">Email <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="p-4 py-4.5">Account Status</th>
                            <th className="p-4 py-4.5">Role Level</th>
                            <th className="p-4 py-4.5 text-right pr-6">Action Panel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {paginatedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[#8E93A1] italic">
                                No registered users found matching the query.
                              </td>
                            </tr>
                          ) : (
                            paginatedUsers.map(u => (
                              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-semibold text-[#E8EAF0]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-xs text-purple-300">
                                      {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{u.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-[#A5A8B2] font-mono">{u.email}</td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                      u.is_verified ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                    }`}>
                                      {u.is_verified ? "Verified" : "Unverified"}
                                    </span>
                                    {u.is_suspended && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-rose-500/20 text-rose-450 border-rose-500/40">
                                        Suspended
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleAssignRole(u.id, e.target.value as any)}
                                    className="p-1.5 border border-white/10 bg-black/40 rounded-xl text-[10px] font-bold text-indigo-400 outline-none cursor-pointer capitalize hover:border-white/20"
                                  >
                                    <option value="student">Student / User</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="support">Support</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right pr-6 relative">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                                      className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                                        u.is_suspended
                                          ? "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 shadow-sm"
                                          : "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-400 shadow-sm"
                                      }`}
                                    >
                                      {u.is_suspended ? "Unsuspend" : "Suspend"}
                                    </button>
                                    
                                    <button
                                      onClick={() => setResettingUser(u)}
                                      className="px-3 py-1.5 text-[10px] font-bold bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 rounded-xl cursor-pointer transition-all shadow-sm"
                                    >
                                      Reset PW
                                    </button>

                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          type: `delete user account for ${u.name}`,
                                          action: () => handleDeleteUser(u.id)
                                        });
                                      }}
                                      className="p-1.5 bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-400 rounded-xl cursor-pointer transition-all shadow-sm"
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-slate-950/20">
                      <span className="text-xs text-[#8E93A1] font-mono">
                        Showing {(userPage - 1) * usersPerPage + 1} - {Math.min(userPage * usersPerPage, sortedUsers.length)} of {sortedUsers.length} entries
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                          disabled={userPage === 1}
                          className="px-3.5 py-1.5 border border-white/10 bg-slate-900 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-bold font-mono">
                          Page {userPage} / {totalUserPages}
                        </span>
                        <button
                          onClick={() => setUserPage(prev => Math.min(totalUserPages, prev + 1))}
                          disabled={userPage === totalUserPages}
                          className="px-3.5 py-1.5 border border-white/10 bg-slate-900 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Reset Modal */}
                  {resettingUser && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 select-none backdrop-blur-sm">
                      <div className="w-full max-w-md p-6 border border-white/10 bg-[#0F0F16] rounded-[24px] space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            Reset Password for {resettingUser.name}
                          </h3>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Password Value</label>
                            <input
                              type="password"
                              value={newPasswordVal}
                              onChange={(e) => setNewPasswordVal(e.target.value)}
                              placeholder="At least 6 characters"
                              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                              required
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResettingUser(null);
                                setNewPasswordVal("");
                              }}
                              className="px-4 py-2 bg-slate-900 border border-white/10 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-500/10"
                            >
                              Save New Password
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: CONTENT CONTROL */}
              {activeTab === "content" && (
                <div className="space-y-6 select-text">
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white tracking-tight">Content Control</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Audit, download, and clean student-generated artifacts and materials</p>
                    </div>
                  </div>

                  {/* Subtabs for content types */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex gap-2">
                      {[
                        { id: "pdfs", label: "PDF Library", count: content.pdfs.length },
                        { id: "notes", label: "Scholars Notes", count: content.notes.length },
                        { id: "quizzes", label: "Quiz Database", count: content.quizzes.length },
                        { id: "flashcards", label: "Flashcards", count: 0 },
                        { id: "chats", label: "AI Chats Logs", count: 0 }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setContentTab(tab.id as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all border ${
                            contentTab === tab.id
                              ? "bg-purple-600/10 border-purple-500/30 text-white"
                              : "border-transparent text-[#8E93A1] hover:text-[#D5D7DE] hover:bg-white/5"
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-black/20 border border-white/10 focus-within:border-purple-500/20 rounded-xl px-3 py-1.5 w-64 transition-colors">
                        <Search className="w-3.5 h-3.5 text-[#8E93A1]" />
                        <input
                          type="text"
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          placeholder={`Search ${contentTab}...`}
                          className="bg-transparent border-none text-xs outline-none text-[#E8EAF0] w-full placeholder-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Grid view of Content cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContent.length === 0 ? (
                      <div className="col-span-full py-20 border border-dashed border-white/10 bg-[#12121A]/20 rounded-[24px] flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl">
                          📂
                        </div>
                        <div>
                          <h4 className="text-[#E8EAF0] font-bold uppercase text-sm tracking-wider">No Content Records</h4>
                          <p className="text-[#8E93A1] text-xs mt-1">There are no generated files matching this category</p>
                        </div>
                      </div>
                    ) : (
                      filteredContent.map((item, idx) => (
                        <div key={item.id || idx} className="p-5 border border-white/10 bg-[#12121A]/50 rounded-[20px] shadow-lg flex flex-col justify-between hover:border-purple-500/20 transition-all group">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/25 transition-colors">
                                {contentTab === "pdfs" ? <FileText className="w-5 h-5" /> : contentTab === "notes" ? <Sliders className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      type: `permanently purge this ${contentTab} record`,
                                      action: () => handleDeleteContent(contentTab, item.id)
                                    });
                                  }}
                                  className="p-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/25 text-[#A5A8B2] hover:text-white cursor-pointer transition-colors"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-[15px] font-bold text-[#E8EAF0] truncate group-hover:text-purple-450 transition-colors" title={item.filename || item.title}>
                                {item.filename || item.title}
                              </h4>
                              {item.owner && (
                                <span className="text-sm text-[#A5A8B2] block">Owner: {item.owner}</span>
                              )}
                              <span className="text-[13px] text-[#8E93A1] block font-mono">
                                ID: {item.id}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between text-[13px] text-[#8E93A1] font-mono">
                            {contentTab === "pdfs" && item.size && (
                              <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                            )}
                            {contentTab === "notes" && item.created_at && (
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            )}
                            {contentTab === "quizzes" && item.score !== undefined && (
                              <span>Score: {item.score}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 4: AI OPERATIONS CENTER */}
              {activeTab === "ai" && aiMonitor && (
                <div className="space-y-6 select-text">
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white tracking-tight">AI Operations Center</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Monitor token consumption, latency peaks, models routing, and Prompt Cache ratios</p>
                    </div>
                    <button
                      onClick={() => loadAllPortalData(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-[#D5D7DE] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Refresh Status
                    </button>
                  </div>

                  {/* AI KPI metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                      { title: "Today's API Calls", val: aiMonitor.requests, sub: "gemini-flash requests", color: "text-purple-400", pct: "75%" },
                      { title: "Tokens Consumed", val: aiMonitor.token_count.toLocaleString(), sub: "Estimated volume limits", color: "text-pink-400", pct: "60%" },
                      { title: "Cache Hit Rate", val: `${aiMonitor.cache_hits} hits`, sub: "Instantly compiled summaries", color: "text-indigo-400", pct: "85%" },
                      { title: "Average Latency", val: "1.24s", sub: "Calculated query return", color: "text-emerald-405", pct: "92%" },
                      { title: "Failed Requests", val: "0 calls", sub: "Rate throttles aborted", color: "text-rose-400", pct: "100%" }
                    ].map((k, idx) => (
                      <div key={idx} className="p-5 border border-white/5 bg-[#12121A]/50 rounded-[20px] shadow-lg flex flex-col justify-between hover:border-purple-500/20 transition-colors">
                        <span className="text-[15px] font-medium text-[#D5D7DE] block">{k.title}</span>
                        <div className="my-3">
                          <h2 className={`text-2xl font-black ${k.color} font-mono`}>{k.val}</h2>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[13px] text-[#A5A8B2] block leading-none">{k.sub}</span>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: k.pct }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Latency History */}
                    <div className="lg:col-span-2 p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-semibold text-[#E8EAF0] flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-purple-400" /> Response times latency (ms)
                        </span>
                        <span className="text-[13px] text-[#8E93A1] uppercase font-mono">Real-time metrics</span>
                      </div>
                      
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={aiMonitor.response_times_ms.map((val: number, idx: number) => ({ name: `Req ${idx + 1}`, value: val }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.darkBorder} />
                            <XAxis dataKey="name" stroke={chartColors.textMuted} fontSize={10} />
                            <YAxis stroke={chartColors.textMuted} fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#111119", border: "1px solid rgba(255,255,255,0.05)" }} labelClassName="text-slate-400 text-xs" />
                            <Line type="monotone" dataKey="value" stroke={chartColors.pink} strokeWidth={2} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Model Distribution */}
                    <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-lg font-semibold text-[#E8EAF0]">
                          Model Distribution
                        </span>
                        <span className="text-[13px] text-[#8E93A1] uppercase font-mono">Routing</span>
                      </div>

                      <div className="h-44 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "gemini-flash-lite", value: 85 },
                                { name: "gemini-1.5-pro", value: 15 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill={chartColors.purple} />
                              <Cell fill={chartColors.pink} />
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#111119", border: "1px solid rgba(255,255,255,0.05)" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A5A8B2] flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> gemini-flash-lite
                          </span>
                          <span className="font-bold text-white font-mono">85%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A5A8B2] flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> gemini-1.5-pro
                          </span>
                          <span className="font-bold text-white font-mono">15%</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 5: SYSTEM MONITORING */}
              {activeTab === "monitoring" && dashboard && (
                <div className="space-y-6 select-text">
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white tracking-tight">System Status</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Live core infrastructure checks, memory capacity, and database read status</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hardware resource loads */}
                    <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-6 shadow-xl">
                      <span className="text-lg font-semibold text-[#E8EAF0] block border-b border-white/5 pb-3">
                        Hardware CPU / Memory Load gauges
                      </span>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#D5D7DE] text-[15px] font-medium">CPU Core Utilizations:</span>
                            <span className="font-mono font-bold text-[#E8EAF0] text-[15px]">{dashboard.metrics.cpu_usage}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: dashboard.metrics.cpu_usage }} />
                          </div>
                          <span className="text-[13px] text-[#8E93A1] block font-mono leading-none">Uptime ticks: Normal</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#D5D7DE] text-[15px] font-medium">Virtual RAM Allocated:</span>
                            <span className="font-mono font-bold text-[#E8EAF0] text-[15px]">{dashboard.metrics.memory_usage}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500" style={{ width: dashboard.metrics.memory_usage }} />
                          </div>
                          <span className="text-[13px] text-[#8E93A1] block font-mono leading-none">Buffer cache: 2.4 GB free</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#D5D7DE] text-[15px] font-medium">Host SSD Disk Space:</span>
                            <span className="font-mono font-bold text-[#E8EAF0] text-[15px]">{dashboard.metrics.disk_usage}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: dashboard.metrics.disk_usage }} />
                          </div>
                          <span className="text-[13px] text-[#8E93A1] block font-mono leading-none">Storage Type: NVMe Partition</span>
                        </div>
                      </div>
                    </div>

                    {/* Services Monitoring */}
                    <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-5 shadow-xl">
                      <span className="text-lg font-semibold text-[#E8EAF0] block border-b border-white/5 pb-3">
                        Subsystems API health state
                      </span>

                      <div className="space-y-4 pt-1 text-xs">
                        {[
                          { name: "Flask Web API Service", desc: "Serving student requests", status: "ONLINE", theme: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" },
                          { name: "JSON MongoDB Engine", desc: "Local database persistent", status: "HEALTHY", theme: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" },
                          { name: "ChromaDB vector logs", desc: "Chroma indexing pipeline", status: "FALLBACK", theme: "bg-amber-500/20 text-amber-400 border border-amber-500/40" },
                          { name: "Redis cache memory", desc: "Session tracking store", status: redisStatus, theme: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" },
                          { name: "Judge0 sandbox compiler", desc: "Coding practice runner", status: "ONLINE", theme: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" }
                        ].map((srv, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                            <div>
                              <strong className="text-[#E8EAF0] block text-[15px] font-semibold">{srv.name}</strong>
                              <span className="text-[13px] text-[#A5A8B2] block mt-0.5">{srv.desc}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${srv.theme}`}>
                              {srv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Background jobs queue */}
                    <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-5 shadow-xl">
                      <span className="text-lg font-semibold text-[#E8EAF0] block border-b border-white/5 pb-3">
                        Active cron & background workers
                      </span>

                      <div className="space-y-3 pt-1">
                        <div className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                          <strong className="text-[11px] font-bold text-[#E8EAF0] uppercase block">Scheduler cron queue</strong>
                          <span className="text-[13px] text-[#A5A8B2]">No scheduled report summaries pending.</span>
                        </div>

                        <div className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                          <strong className="text-[11px] font-bold text-[#E8EAF0] uppercase block">Active Worker Thread</strong>
                          <div className="flex justify-between items-center text-[13px]">
                            <span className="text-[#A5A8B2]">Status: Running</span>
                            <span className="font-mono text-purple-400 font-bold">{activeJobsCount} threads</span>
                          </div>
                        </div>

                        <div className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1.5">
                          <strong className="text-[11px] font-bold text-[#E8EAF0] uppercase block">Diagnostics details</strong>
                          <div className="flex justify-between text-[13px] font-mono text-[#A5A8B2]">
                            <span>Ping Latency:</span>
                            <span className="text-emerald-405 font-bold">{networkLatency} ms</span>
                          </div>
                          <div className="flex justify-between text-[13px] font-mono text-[#A5A8B2]">
                            <span>Socket pools:</span>
                            <span>12 connections</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 6: SECURITY AUDIT LOGS */}
              {activeTab === "security" && (
                <div className="space-y-6 select-text">
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-[40px] font-bold text-white tracking-tight">Security Audit Logs</h1>
                      <p className="text-sm font-normal text-[#A5A8B2] mt-1">Chronological record of system modifications, logins, and API triggers</p>
                    </div>
                    <button
                      onClick={exportLogsToCSV}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-purple-500/20 text-[#D5D7DE] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Export CSV Sheet
                    </button>
                  </div>

                  {/* Audit filters */}
                  <div className="flex justify-between items-center p-4 border border-white/5 bg-[#12121A]/50 rounded-[20px] gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2.5 bg-black/20 border border-white/5 focus-within:border-purple-500/20 rounded-xl px-3 py-1.5 w-64 transition-colors">
                        <Search className="w-3.5 h-3.5 text-[#8E93A1]" />
                        <input
                          type="text"
                          value={logSearch}
                          onChange={(e) => {
                            setLogSearch(e.target.value);
                            setLogPage(1);
                          }}
                          placeholder="Search user, IP..."
                          className="bg-transparent border-none text-xs outline-none text-[#E8EAF0] w-full placeholder-slate-600"
                        />
                      </div>

                      <select
                        value={logActionFilter}
                        onChange={(e) => {
                          setLogActionFilter(e.target.value);
                          setLogPage(1);
                        }}
                        className="px-3 py-1.5 border border-white/10 bg-black/30 rounded-xl text-xs text-[#D5D7DE] outline-none cursor-pointer hover:border-white/20"
                      >
                        <option value="">All Actions</option>
                        <option value="login">Login</option>
                        <option value="register">Registration</option>
                        <option value="chat">AI Chat</option>
                        <option value="upload">Upload</option>
                        <option value="tutor">Tutor Calls</option>
                      </select>
                    </div>

                    <span className="text-xs text-[#D5D7DE] font-mono uppercase font-bold">
                      {filteredLogs.length} total events matching
                    </span>
                  </div>

                  {/* Audit Trail list table */}
                  <div className="border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-white/5 text-[#D5D7DE] font-semibold text-[13px] uppercase tracking-wider bg-slate-950/20">
                            <th className="p-4 py-4">User Name</th>
                            <th className="p-4 py-4">System action logged</th>
                            <th className="p-4 py-4">IP Address</th>
                            <th className="p-4 py-4">Device User Agent</th>
                            <th className="p-4 py-4 text-right pr-6">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[#D5D7DE]">
                          {paginatedLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[#8E93A1] italic">
                                No audit logs logged matching search parameters.
                              </td>
                            </tr>
                          ) : (
                            paginatedLogs.map(log => (
                              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-purple-400">{log.user_name}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-[#E8EAF0]">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-4 text-[#A5A8B2]">{log.ip_address}</td>
                                <td className="p-4 text-[#8E93A1] truncate max-w-[240px]" title={log.user_agent}>
                                  {log.user_agent}
                                </td>
                                <td className="p-4 text-right text-[#8E93A1] pr-6">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Logs Pagination */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-slate-950/20">
                      <span className="text-xs text-[#8E93A1] font-mono">
                        Showing {(logPage - 1) * logsPerPage + 1} - {Math.min(logPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLogPage(prev => Math.max(1, prev - 1))}
                          disabled={logPage === 1}
                          className="px-3.5 py-1.5 border border-white/10 bg-slate-900 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Prev
                        </button>
                        <span className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-bold font-mono">
                          Page {logPage} / {totalLogPages}
                        </span>
                        <button
                          onClick={() => setLogPage(prev => Math.min(totalLogPages, prev + 1))}
                          disabled={logPage === totalLogPages}
                          className="px-3.5 py-1.5 border border-white/10 bg-slate-900 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 7: GLOBAL CONFIGURATIONS */}
              {activeTab === "settings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 select-text">
                  
                  {/* Site Configurations */}
                  <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-6 shadow-xl">
                    <span className="text-lg font-semibold text-[#E8EAF0] block border-b border-white/5 pb-3">
                      Enterprise site configuration settings
                    </span>
                    
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[15px] font-medium text-[#D5D7DE] uppercase tracking-wider">Site Brand Name</label>
                        <input
                          type="text"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/25 border border-white/5 rounded-2xl">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Maintenance mode advisory</span>
                          <p className="text-[10px] text-[#A5A8B2] mt-1">Suspend student logins for database operations</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                          className="w-4 h-4 text-purple-600 cursor-pointer rounded bg-black border-white/10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[15px] font-medium text-[#D5D7DE] uppercase tracking-wider">SMTP SMTP Mailer Account</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[15px] font-medium text-[#D5D7DE] uppercase tracking-wider">Gemini LLM model configuration</label>
                        <select
                          value={geminiModel}
                          onChange={(e) => setGeminiModel(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-300 outline-none cursor-pointer focus:ring-2 focus:ring-purple-600"
                        >
                          <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Default)</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash-exp</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-md shadow-purple-500/10"
                      >
                        Commit configurations
                      </button>
                    </form>

                    {/* Danger zone inside Settings card */}
                    <div className="border-t border-white/5 pt-6 space-y-4">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Danger Zone operations</span>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              type: "CRITICAL: PURGE ALL SCHOLARS AND DATABASE CONTENTS permanently",
                              action: async () => {
                                try {
                                  await api.delete("/api/admin/system/reset-db");
                                  addToast("Database Reset", "All data tables purged.", "success");
                                  loadAllPortalData(true);
                                } catch (e) {
                                  addToast("Failed", "Database purge failed.", "error");
                                }
                              }
                            });
                          }}
                          className="py-2.5 border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Purge Database
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              type: "RESET ALL STUDY AND COGNITIVE METRICS STATISTICS permanently",
                              action: async () => {
                                try {
                                  await api.delete("/api/admin/system/reset-analytics");
                                  addToast("Metrics Reset", "Analytics metrics cleared.", "success");
                                  loadAllPortalData(true);
                                } catch (e) {
                                  addToast("Failed", "Analytics reset failed.", "error");
                                }
                              }
                            });
                          }}
                          className="py-2.5 border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Reset Analytics
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Broadcast global announcements */}
                  <div className="p-6 border border-white/5 bg-[#12121A]/50 backdrop-blur-xl rounded-[22px] space-y-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <span className="text-lg font-semibold text-[#E8EAF0] block border-b border-white/5 pb-3">
                        Broadcast global scholar notification
                      </span>
                      
                      <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-[15px] font-medium text-[#D5D7DE] uppercase tracking-wider">Advisory Title</label>
                          <input
                            type="text"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[15px] font-medium text-[#D5D7DE] uppercase tracking-wider">Advisory Message Content</label>
                          <textarea
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            placeholder="Type markdown advisory to alert active users..."
                            className="w-full h-48 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 resize-none leading-relaxed transition-all"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={broadcasting || !broadcastMessage.trim()}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10"
                        >
                          {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />} Dispatch Advisory Alert
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {/* 3. CONFIRMATION DIALOG MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 select-none backdrop-blur-sm">
          <div className="w-full max-w-md p-6 border border-white/10 bg-[#0F0F16] rounded-[24px] space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold tracking-tight">CRITICAL ALERT ACTION</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-350">
              You are attempting to perform a destructive operation: <strong className="text-white">{confirmModal.type}</strong>. 
              This action cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-900 border border-white/10 text-[#D5D7DE] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Abort Action
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.action();
                  setConfirmModal(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/15"
              >
                Confirm Execute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
