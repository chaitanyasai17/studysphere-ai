import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  FileText,
  BookOpen,
  HelpCircle,
  FolderLock,
  Calendar,
  Code,
  FileBadge,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Check,
  Trash2,
  Lock,
  Menu,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  Shield,
  Sliders,
  Monitor,
  Keyboard,
  Info,
  CheckCircle,
  Flame,
  Award,
  Clock
} from "lucide-react";

// Emojis list grouped by category
const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😎", "🤓", "😊", "😁", "😄", "😇", "😌", "😍", "🤔", "🥳", "🤠"]
  },
  {
    name: "Study & Tech",
    emojis: ["🧑‍💻", "👨‍🎓", "👩‍🎓", "🧠", "📚", "✍️", "💻", "🔬", "🎨", "🚀", "💡", "🛠️"]
  },
  {
    name: "Gamification",
    emojis: ["🔥", "🏆", "🎖️", "🎯", "✨", "🌟", "👑", "💎", "⚡", "🔮"]
  }
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addToast
  } = useNotifications();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Popover & Drawer states
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const [settingsSpin, setSettingsSpin] = useState(false);
  const [avatarTrigger, setAvatarTrigger] = useState(false);

  // Settings Forms
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editDept, setEditDept] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifPreferences, setNotifPreferences] = useState({
    systemAlerts: true,
    emailAlerts: false,
    weeklyDigest: true,
  });

  const [privacyPreferences, setPrivacyPreferences] = useState({
    publicProfile: false,
    shareAnalytics: true,
  });

  const [searchEmoji, setSearchEmoji] = useState("");

  // Load favorites / recents from localStorage
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    const saved = localStorage.getItem("recent_emojis");
    return saved ? JSON.parse(saved) : ["🎓", "🤖", "🧑‍💻", "🔥", "🚀", "✨"];
  });

  // Avatar random idle animation triggers
  useEffect(() => {
    const interval = setInterval(() => {
      setAvatarTrigger(true);
      setTimeout(() => setAvatarTrigger(false), 1200);
    }, 15000); // Pulse every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/api/profile")
        .then(res => {
          setProfile(res.data);
          setEditName(res.data.name || "");
          setEditBio(res.data.bio || "");
          setEditCollege(res.data.college || "");
          setEditDept(res.data.department || "");
        })
        .catch(() => {});
    }
  }, [user]);

  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "AI Tutor", path: "/ai", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "Notes", path: "/notes", icon: <FileText className="w-4 h-4" /> },
    { name: "PDF Learning", path: "/pdf", icon: <BookOpen className="w-4 h-4" /> },
    { name: "Quiz Generator", path: "/quiz", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "Flashcards", path: "/flashcards", icon: <FolderLock className="w-4 h-4" /> },
    { name: "Planner", path: "/planner", icon: <Calendar className="w-4 h-4" /> },
    { name: "Coding Practice", path: "/coding", icon: <Code className="w-4 h-4" /> },
    { name: "Cybersecurity Lab", path: "/cybersecurity", icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
    { name: "Resume Assistant", path: "/resume", icon: <FileBadge className="w-4 h-4" /> },
    { name: "Progress Analytics", path: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (user?.role === "admin") {
    navigationItems.push({
      name: "Admin Panel",
      path: "/admin",
      icon: <Lock className="w-4 h-4 text-emerald-500" />
    });
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/profile", {
        name: editName,
        bio: editBio,
        college: editCollege,
        department: editDept
      });
      updateUser({ name: editName });
      setProfile((prev: any) => prev ? { ...prev, name: editName, bio: editBio, college: editCollege, department: editDept } : null);
      addToast("Profile Updated", "Your information has been saved successfully.", "success");
    } catch (err) {
      addToast("Update Failed", "Could not sync information to backend.", "error");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("Validation Error", "All fields are required.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Password Mismatch", "New passwords do not match.", "warning");
      return;
    }
    try {
      await api.put("/api/profile", { current_password: currentPassword, new_password: newPassword });
      addToast("Security Settings", "Your password has been changed successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      addToast("Update Failed", err.response?.data?.message || "Verify your current password.", "error");
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    try {
      const updatedProfile = { ...profile, avatar: emoji };
      setProfile(updatedProfile);
      updateUser({ avatar: emoji });
      
      await api.put("/api/profile", { avatar: emoji });
      
      // Update recents
      const newRecents = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 6);
      setRecentEmojis(newRecents);
      localStorage.setItem("recent_emojis", JSON.stringify(newRecents));
      
      addToast("Avatar Updated", `Selected ${emoji} as your avatar.`, "success");
      setPickerOpen(false);
    } catch (err) {
      addToast("Error", "Could not sync avatar preference to database.", "error");
    }
  };

  const filteredCategories = EMOJI_CATEGORIES.map(category => {
    return {
      ...category,
      emojis: category.emojis.filter(emoji => {
        if (!searchEmoji) return true;
        const keywords: Record<string, string> = {
          "😀": "smiley grin happy face",
          "😎": "cool glasses shades black",
          "🤓": "nerd geek study smart specs",
          "😊": "blush smile kind content",
          "🤖": "robot ai tutor bot intelligence",
          "😁": "happy grin excited teeth",
          "😄": "laugh smile laughing fun",
          "😇": "angel halo pure kind holy",
          "😌": "relieved peace calm rest",
          "😍": "love heart eyes admire sweet",
          "🤔": "think thought query ponder wonder",
          "🥳": "party celebrate celebrate whistle hat",
          "🤠": "cowboy hat ranger western",
          "🧑‍💻": "coder developer developer programmer technology",
          "👨‍🎓": "graduate student diploma male degree school",
          "👩‍🎓": "graduate student diploma female degree school",
          "🧠": "brain mind intelligence ideas smart",
          "📚": "books study library reader notes",
          "✍️": "write pencil author homework notes",
          "💻": "computer laptop work digital technology",
          "🔬": "microscope science research lab biology",
          "🎨": "paint artist brush creative design canvas",
          "🚀": "rocket launch spaceship speed startup growth",
          "💡": "idea bulb light intelligence creative math",
          "🛠️": "tools settings build repair engineering custom",
          "🔥": "fire hot streak energy burn warm",
          "🏆": "trophy winner award first gold",
          "🎖️": "medal award badge merit honor level",
          "🎯": "target focus goal aim bullseye",
          "✨": "sparkles glow magic clean shine premium",
          "🌟": "star glow bright master rank high",
          "👑": "crown queen king leader royal victory",
          "💎": "diamond gem ruby premium expensive rich",
          "⚡": "lightning spark thunder speed power fast",
          "🔮": "magic sphere oracle crystal ai predict"
        };
        return (keywords[emoji] || "").toLowerCase().includes(searchEmoji.toLowerCase());
      })
    };
  }).filter(c => c.emojis.length > 0);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans relative overflow-hidden">
      
      {/* Sidebar Mobile Toggle Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 glass border-r border-slate-200/50 dark:border-slate-800/40 transform transition-all duration-300 lg:transform-none lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:rounded-[28px] lg:flex lg:flex-col lg:h-[calc(100vh-2rem)] ${
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[280px]"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-0 max-lg:-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                StudySphere AI
              </span>
            )}
          </Link>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center p-1 rounded-md hover:bg-slate-100/50 dark:hover:bg-slate-850/20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 ${
                  sidebarCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/20"
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <div className="flex-shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                {!sidebarCollapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/40 flex flex-col gap-3">
          <div 
            onClick={() => setPopoverOpen(true)}
            className="flex flex-col gap-2 p-2 hover:bg-slate-800/20 rounded-xl transition-all w-full border border-transparent hover:border-slate-205/30 overflow-hidden cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-lg flex items-center justify-center font-semibold border border-purple-500/20 overflow-hidden flex-shrink-0">
                {profile?.avatar && !profile.avatar.startsWith("/") ? profile.avatar : "🎓"}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-grow">
                  <p className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-200">
                    {user?.name}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">
                    Level {profile?.level || 1} • 🪙 {profile?.coins || 0}
                  </p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && profile && (
              <div className="space-y-1 mt-0.5">
                <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400 uppercase">
                  <span>XP PROGRESS</span>
                  <span>{profile.xp_points % 200} / 200</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${((profile.xp_points % 200) / 200) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-colors w-full cursor-pointer ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div 
        className={`flex-grow flex flex-col min-w-0 relative transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[92px]" : "lg:pl-[300px]"
        }`}
      >
        
        {/* Top Header bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/30 dark:bg-slate-950/20 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
              className="hidden md:flex items-center gap-2 px-3 h-9 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] text-slate-450 cursor-pointer hover:border-indigo-500/40 dark:hover:border-indigo-500/20 transition-all w-64 animate-pulse-slow"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search anything...</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[9px]">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Tray Trigger */}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 relative text-slate-600 dark:text-slate-400 cursor-pointer active:scale-95 transition-transform"
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? "animate-bell-shake" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-slate-950 animate-badge-pulse" />
              )}
            </button>

            {/* Settings shortcut (Slide right drawer on click) */}
            <motion.button
              whileHover={{ rotate: 90 }}
              animate={{ rotate: settingsSpin ? 180 : 0 }}
              onClick={() => {
                setSettingsSpin(true);
                setTimeout(() => setSettingsSpin(false), 500);
                setSettingsOpen(true);
              }}
              className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>

            {/* Emoji Avatar with Popover functionality */}
            <motion.div
              animate={avatarTrigger ? {
                scale: [1, 1.08, 0.95, 1.05, 1],
                y: [0, -4, 2, -1, 0],
                boxShadow: [
                  "0 0 0px rgba(139, 92, 246, 0)",
                  "0 0 15px rgba(139, 92, 246, 0.4)",
                  "0 0 0px rgba(139, 92, 246, 0)"
                ]
              } : {}}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPopoverOpen(!popoverOpen)}
              className="w-8 h-8 rounded-full bg-purple-500/10 text-lg flex items-center justify-center border border-purple-500/20 shadow-inner flex-shrink-0 select-none cursor-pointer"
            >
              {profile?.avatar && !profile.avatar.startsWith("/") ? profile.avatar : "😊"}
            </motion.div>

            {/* Profile Popover Overlay */}
            <AnimatePresence>
              {popoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#181922] p-4 shadow-2xl flex flex-col gap-4"
                  >
                    {/* Welcome banner */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 text-xl flex items-center justify-center flex-shrink-0 select-none">
                        {profile?.avatar && !profile.avatar.startsWith("/") ? profile.avatar : "👋"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">👋 Welcome back</span>
                        <strong className="text-xs text-slate-800 dark:text-white truncate block">{user?.name}</strong>
                        <span className="text-[9.5px] text-slate-400 truncate block">{user?.email}</span>
                      </div>
                    </div>

                    {/* Stats details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12131A] border border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400 block uppercase font-bold text-[8px]">XP Level</span>
                        <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Level {profile?.level || 1}
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12131A] border border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400 block uppercase font-bold text-[8px]">Streak</span>
                        <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-rose-500" /> {profile?.streakCount || 0} Days
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12131A] border border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400 block uppercase font-bold text-[8px]">Study Hours</span>
                        <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" /> {profile?.studyHours || 0} hrs
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#12131A] border border-slate-100 dark:border-slate-800/40">
                        <span className="text-slate-400 block uppercase font-bold text-[8px]">Current Course</span>
                        <strong className="text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                          {profile?.department || "Computer Science"}
                        </strong>
                      </div>
                    </div>

                    {/* Popover Action Links */}
                    <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <button 
                        onClick={() => { setPopoverOpen(false); navigate("/profile"); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/55 text-[11px] text-slate-300 font-bold transition-all text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-500" /> View / Edit Profile
                      </button>
                      <button 
                        onClick={() => { setPopoverOpen(false); setPickerOpen(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/55 text-[11px] text-slate-300 font-bold transition-all text-left cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Change Avatar Emoji
                      </button>
                      <button 
                        onClick={() => { setPopoverOpen(false); setSettingsOpen(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/55 text-[11px] text-slate-300 font-bold transition-all text-left cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" /> Settings Panel
                      </button>
                      <button 
                        onClick={() => { setPopoverOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 text-[11px] text-rose-500 font-bold transition-all text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main scroll container */}
        <main className="flex-grow overflow-y-auto p-6 lg:p-8 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full h-full"
            >
              <React.Suspense fallback={
                <div className="flex flex-col gap-6 w-full animate-pulse">
                  <div className="h-8 w-1/3 bg-slate-200/10 dark:bg-slate-800/30 rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-slate-200/10 dark:bg-slate-800/20 rounded-2xl" />
                    <div className="h-32 bg-slate-200/10 dark:bg-slate-800/20 rounded-2xl" />
                    <div className="h-32 bg-slate-200/10 dark:bg-slate-800/20 rounded-2xl" />
                  </div>
                  <div className="h-72 bg-slate-200/10 dark:bg-slate-800/20 rounded-3xl" />
                </div>
              }>
                {children}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Notification side drawer */}
      <AnimatePresence>
        {notifOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="absolute inset-y-0 right-0 max-w-sm w-full bg-white dark:bg-[#12131A] border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500 animate-bell-shake" /> Notifications ({unreadCount} unread)
                </h3>
                <button 
                  onClick={() => setNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-left text-[10px] font-semibold text-indigo-500 hover:text-indigo-650 w-fit"
                >
                  Mark all as read
                </button>
              )}

              {/* Notifications scroll list */}
              <div className="flex-grow overflow-y-auto flex flex-col gap-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No notifications or reminders yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 rounded-xl border transition-all ${
                        n.is_read
                          ? "border-white/5 bg-[#12131A] opacity-60"
                          : "border-indigo-500/20 bg-indigo-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {n.title}
                        </h4>
                        <div className="flex gap-1.5">
                          {!n.is_read && (
                            <button
                              onClick={() => markAsRead(n._id)}
                              className="p-1 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n._id)}
                            className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-2 block">
                        {new Date(n.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Settings Side Drawer */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="absolute inset-y-0 right-0 max-w-xl w-full bg-[#12131A] border-l border-slate-800 shadow-2xl flex overflow-hidden rounded-l-3xl z-50"
            >
              {/* Drawer Sidebar Menu */}
              <div className="w-[180px] bg-[#0B0B12] border-r border-slate-800 p-4 flex flex-col gap-1 select-none">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 px-3 mb-2 block">System Settings</span>
                {[
                  { id: "profile", label: "Profile", icon: User },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "privacy", label: "Privacy", icon: ShieldAlert },
                  { id: "security", label: "Security", icon: Shield },
                  { id: "study", label: "Study Prefs", icon: Sliders },
                  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
                  { id: "about", label: "About App", icon: Info }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isSelected = activeSettingsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-left cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/10" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => { setSettingsOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-left text-rose-500 hover:bg-rose-500/10 mt-auto cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Drawer Active Tab Details Content */}
              <div className="flex-grow p-6 flex flex-col gap-4 overflow-y-auto min-w-0 bg-[#12131A]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white capitalize flex items-center gap-2">
                    {activeSettingsTab === "profile" && <User className="w-4 h-4 text-indigo-500" />}
                    {activeSettingsTab === "notifications" && <Bell className="w-4 h-4 text-indigo-500" />}
                    {activeSettingsTab === "privacy" && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                    {activeSettingsTab === "security" && <Shield className="w-4 h-4 text-emerald-500" />}
                    {activeSettingsTab === "study" && <Sliders className="w-4 h-4 text-amber-500" />}
                    {activeSettingsTab === "shortcuts" && <Keyboard className="w-4 h-4 text-purple-500" />}
                    {activeSettingsTab === "about" && <Info className="w-4 h-4 text-indigo-500" />}
                    {activeSettingsTab.replace("_", " ")} Options
                  </h3>
                  <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-slate-205 cursor-pointer p-1 rounded hover:bg-slate-800/10">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeSettingsTab === "profile" && (
                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs select-none">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Student Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="User name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Academic Bio</label>
                      <textarea 
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        placeholder="Brief bio describing your studies..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">College / University</label>
                        <input 
                          type="text" 
                          value={editCollege}
                          onChange={(e) => setEditCollege(e.target.value)}
                          className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="e.g. Stanford"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Department</label>
                        <input 
                          type="text" 
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                          className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="e.g. CS"
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/10">
                      Save Changes
                    </button>
                  </form>
                )}

                {activeSettingsTab === "notifications" && (
                  <div className="space-y-4 text-xs select-none">
                    <p className="text-slate-400 leading-relaxed">Configure how you receive platform updates, study reminders, and spaced-repetition notifications.</p>
                    <div className="space-y-3">
                      {[
                        { key: "systemAlerts", title: "System Alerts", desc: "Show push notifications inside dashboard header" },
                        { key: "emailAlerts", title: "Email Reminders", desc: "Receive email reports for scheduled flashcard reviews" },
                        { key: "weeklyDigest", title: "Weekly Progress Report", desc: "Receive a summary scorecard timeline of XP earned" }
                      ].map(item => (
                        <div key={item.key} className="flex items-start justify-between p-3.5 border rounded-2xl border-white/5 bg-[#181922] gap-3">
                          <div>
                            <strong className="text-slate-200 block font-bold">{item.title}</strong>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={(notifPreferences as any)[item.key]}
                            onChange={(e) => {
                              const newPrefs = { ...notifPreferences, [item.key]: e.target.checked };
                              setNotifPreferences(newPrefs);
                              localStorage.setItem("notif_preferences", JSON.stringify(newPrefs));
                              addToast("Saved", "Notification updated successfully.", "success");
                            }}
                            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSettingsTab === "privacy" && (
                  <div className="space-y-4 text-xs select-none">
                    <p className="text-slate-400 leading-relaxed">Manage your profile visibility, study data telemetry, and AI tutor context sharing options.</p>
                    <div className="space-y-3">
                      {[
                        { key: "publicProfile", title: "Public Leaderboard Profile", desc: "Allow other students to view your name and level in local scores" },
                        { key: "shareAnalytics", title: "Share Study Analytics", desc: "Provide telemetry data to improve AI customized syllabus roadmaps" }
                      ].map(item => (
                        <div key={item.key} className="flex items-start justify-between p-3.5 border rounded-2xl border-white/5 bg-[#181922] gap-3">
                          <div>
                            <strong className="text-slate-200 block font-bold">{item.title}</strong>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={(privacyPreferences as any)[item.key]}
                            onChange={(e) => {
                              const newPrefs = { ...privacyPreferences, [item.key]: e.target.checked };
                              setPrivacyPreferences(newPrefs);
                              localStorage.setItem("privacy_preferences", JSON.stringify(newPrefs));
                              addToast("Saved", "Privacy setting updated successfully.", "success");
                            }}
                            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSettingsTab === "security" && (
                  <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs select-none">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Current Password</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-655 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-655 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4.5 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white placeholder-slate-655 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-655 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/10">
                      Change Password
                    </button>
                  </form>
                )}

                {activeSettingsTab === "study" && (
                  <div className="space-y-4 text-xs select-none">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Default AI Model</label>
                      <select 
                        value={profile?.ai_model || "gpt-4o-mini"} 
                        onChange={async (e) => {
                          const val = e.target.value;
                          setProfile((prev: any) => prev ? { ...prev, ai_model: val } : null);
                          await api.put("/api/profile", { ai_model: val });
                          addToast("Model Saved", `AI Tutor context switched to ${val}.`, "success");
                        }}
                        className="w-full px-3 py-2 border rounded-xl border-slate-800 bg-[#0B0B12] text-white outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="gpt-4o-mini">GPT-4o Mini (Default Optimized)</option>
                        <option value="gpt-4o">GPT-4o (Reasoning & Advanced Coding)</option>
                        <option value="o1-mini">o1 Mini (Science & Mathematics)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Learning Style</label>
                      <select 
                        value={profile?.learning_style || "Visual"} 
                        onChange={async (e) => {
                          const val = e.target.value;
                          setProfile((prev: any) => prev ? { ...prev, learning_style: val } : null);
                          await api.put("/api/profile", { learning_style: val });
                          addToast("Preference Updated", `AI suggestions customized for ${val} learners.`, "success");
                        }}
                        className="w-full px-3 py-2 border rounded-xl border-slate-800 bg-[#0B0B12] text-white outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Visual">Visual (Mindmaps, timelines, charts)</option>
                        <option value="Auditory">Auditory (Podcasts, read aloud descriptions)</option>
                        <option value="Kinaesthetic">Kinaesthetic (Coding sandboxes, active projects)</option>
                        <option value="Read/Write">Read/Write (Summaries, text cheat-sheets)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target Role</label>
                        <input 
                          type="text" 
                          value={profile?.target_role || "Software Engineer"}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setProfile((prev: any) => prev ? { ...prev, target_role: val } : null);
                          }}
                          onBlur={async () => {
                            await api.put("/api/profile", { target_role: profile?.target_role });
                            addToast("Saved Target", "Career target role updated.", "success");
                          }}
                          className="w-full px-3 py-2 border rounded-xl border-slate-800 bg-[#0B0B12] text-white outline-none focus:border-indigo-500"
                          placeholder="e.g. SOC Analyst"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target Company</label>
                        <input 
                          type="text" 
                          value={profile?.target_company || "Google"}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setProfile((prev: any) => prev ? { ...prev, target_company: val } : null);
                          }}
                          onBlur={async () => {
                            await api.put("/api/profile", { target_company: profile?.target_company });
                            addToast("Saved Target", "Career target company updated.", "success");
                          }}
                          className="w-full px-3 py-2 border rounded-xl border-slate-800 bg-[#0B0B12] text-white outline-none focus:border-indigo-500"
                          placeholder="e.g. OpenAI"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === "shortcuts" && (
                  <div className="space-y-3 text-xs select-none">
                    <p className="text-slate-400 leading-relaxed">Quickly navigate the platform using keyboard triggers:</p>
                    <div className="divide-y divide-slate-800">
                      {[
                        { keys: "⌘ K / Ctrl + K", desc: "Open Command Palette Search" },
                        { keys: "Ctrl + Enter", desc: "Execute code inside Playgrounds" },
                        { keys: "Ctrl + S", desc: "Quick Save current Note" },
                        { keys: "Esc", desc: "Dismiss drawers and popovers" },
                        { keys: "Ctrl + L", desc: "Reset active AI Tutor chats context" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5">
                          <span className="text-slate-300">{item.desc}</span>
                          <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-indigo-400">{item.keys}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSettingsTab === "about" && (
                  <div className="space-y-4 text-xs select-none text-center py-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-3xl animate-float-robot">
                      🔮
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm">StudySphere AI</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Version 2.1.0-dark • Premium AI SaaS Platform</p>
                    </div>
                    <p className="text-slate-400 max-w-xs mx-auto leading-relaxed mt-2">Engineered in pairing partnership with Google Deepmind teams. All educational systems and AI vector indexes fully operational.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Emoji Avatar Picker Modal Overlay */}
      <AnimatePresence>
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setPickerOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className="relative w-full max-w-md bg-[#181922] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden z-50 select-none"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Choose Custom Avatar
                </h3>
                <button onClick={() => setPickerOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Emoji Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text" 
                  value={searchEmoji}
                  onChange={(e) => setSearchEmoji(e.target.value)}
                  placeholder="Search emojis (e.g. robot, study, student)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/5 bg-[#0B0B12] text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex-grow overflow-y-auto max-h-[300px] space-y-4 scrollbar-none pr-1">
                {/* Recent Emojis Grid (Only shown when not searching) */}
                {!searchEmoji && recentEmojis.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">Recent / Favorites</span>
                    <div className="grid grid-cols-6 gap-2">
                      {recentEmojis.map((emoji, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectEmoji(emoji)}
                          className={`aspect-square rounded-xl border flex items-center justify-center text-xl cursor-pointer bg-[#12131A] transition-all ${
                            profile?.avatar === emoji 
                              ? "border-indigo-500 shadow-[0_0_12px_rgba(139,92,246,0.3)] bg-indigo-500/10" 
                              : "border-slate-800/40 hover:border-slate-600"
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emojis Categories grids */}
                {filteredCategories.map((category, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 block">{category.name}</span>
                    <div className="grid grid-cols-6 gap-2">
                      {category.emojis.map((emoji, eIdx) => (
                        <motion.button
                          key={eIdx}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectEmoji(emoji)}
                          className={`aspect-square rounded-xl border flex items-center justify-center text-xl cursor-pointer bg-[#12131A] transition-all ${
                            profile?.avatar === emoji 
                              ? "border-indigo-500 shadow-[0_0_12px_rgba(139,92,246,0.3)] bg-indigo-500/10" 
                              : "border-slate-800/40 hover:border-slate-600"
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No matching emojis found for your search.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
