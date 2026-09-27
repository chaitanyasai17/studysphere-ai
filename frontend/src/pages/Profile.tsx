import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  Globe,
  Award,
  Camera,
  Check,
  Save,
  Loader2,
  Layout,
  Briefcase,
  HelpCircle,
  X,
  ShieldCheck,
  Coins
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  bio: string;
  college: string;
  semester: string;
  department: string;
  skills: string[];
  goals: string;
  avatar: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  study_interests: string[];
  learning_style: string;
  target_company: string;
  target_role: string;
  ai_model: string;
  theme_pref: string;
  xp_points: number;
  coins: number;
  level: number;
  badges: string[];
}

const presetAvatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bear",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Coco",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver"
];

const badgeColors: Record<string, string> = {
  "Bronze Scholar": "bg-amber-600/10 text-amber-500 border-amber-600/20",
  "Silver Scholar": "bg-slate-400/10 text-slate-300 border-slate-400/20",
  "Gold Scholar": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Level 5 Veteran": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Intellect Sovereign": "bg-purple-500/10 text-purple-400 border-purple-500/20"
};

export const Profile: React.FC = () => {
  const { addToast } = useNotifications();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "career" | "settings" | "help">("details");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      await api.put("/api/profile", profile);
      addToast("Profile Updated", "Your profile details have been saved successfully.", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);
      const res = await api.post("/api/profile/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfile(prev => prev ? { ...prev, avatar: res.data.avatar_url } : null);
      updateUser({ avatar: res.data.avatar_url });
      addToast("Avatar Uploaded", "Your profile picture has been updated.", "success");
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    if (!profile) return;
    try {
      setProfile(prev => prev ? { ...prev, avatar: url } : null);
      updateUser({ avatar: url });
      await api.put("/api/profile", { ...profile, avatar: url });
      setShowAvatarDialog(false);
      addToast("Avatar Selected", "Your profile avatar has been updated.", "success");
    } catch (err) {
      console.error("Failed to set avatar preset:", err);
    }
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.bio,
      profile.college,
      profile.semester,
      profile.department,
      profile.goals,
      profile.github_url,
      profile.linkedin_url,
      profile.portfolio_url,
      profile.learning_style,
      profile.target_company,
      profile.target_role,
      profile.avatar
    ];
    const filled = fields.filter(f => {
      if (Array.isArray(f)) return f.length > 0;
      return f && f.trim() !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  };

  const addSkill = () => {
    if (!profile || !skillInput.trim()) return;
    if (profile.skills.includes(skillInput.trim())) return;
    setProfile({
      ...profile,
      skills: [...profile.skills, skillInput.trim()]
    });
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    if (!profile) return;
    const updated = [...profile.skills];
    updated.splice(index, 1);
    setProfile({ ...profile, skills: updated });
  };

  const addInterest = () => {
    if (!profile || !interestInput.trim()) return;
    if (profile.study_interests.includes(interestInput.trim())) return;
    setProfile({
      ...profile,
      study_interests: [...profile.study_interests, interestInput.trim()]
    });
    setInterestInput("");
  };

  const removeInterest = (index: number) => {
    if (!profile) return;
    const updated = [...profile.study_interests];
    updated.splice(index, 1);
    setProfile({ ...profile, study_interests: updated });
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 bg-[#0a0a12]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 bg-[#0a0a12]">
        <p className="text-sm text-slate-400">Profile not loaded.</p>
      </div>
    );
  }

  const completionPercent = calculateCompletion();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-grow p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto bg-[#0a0a12] min-h-screen text-slate-400"
    >
      
      {/* Top Hero Section */}
      <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 lg:p-8 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full border border-white/[0.06] bg-[#0f0f1a] overflow-hidden flex items-center justify-center text-4xl font-bold text-purple-500 shadow-xl">
              {profile.avatar ? (
                profile.avatar.startsWith("/") || profile.avatar.startsWith("http") ? (
                  <img src={profile.avatar.startsWith("/") ? `${api.defaults.baseURL}${profile.avatar}` : profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="select-none">{profile.avatar}</span>
                )
              ) : (
                profile.name.split(" ").map(w => w[0]).join("").toUpperCase()
              )}
            </div>
            <div 
              onClick={() => setShowAvatarDialog(true)}
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-grow space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {profile.name}
                  {profile.is_verified && <ShieldCheck className="w-5 h-5 text-purple-500" />}
                </h1>
                <p className="text-sm flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {profile.email}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-purple-400">Level {profile.level}</span>
                  <span className="text-sm font-bold text-white">{profile.xp_points} XP</span>
                </div>
                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-amber-400">Balance</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500" /> {profile.coins}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 max-w-xl">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>Profile Completion</span>
                <span className="text-purple-400">{completionPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#0f0f1a] rounded-full overflow-hidden border border-white/[0.06]">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.badges.map((b) => (
                  <span 
                    key={b} 
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                      badgeColors[b] || "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#161625] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
        
        {/* Horizontal Tabs */}
        <div className="flex overflow-x-auto border-b border-white/[0.06] scrollbar-hide">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none ${
              activeTab === "details"
                ? "border-purple-500 text-purple-400"
                : "border-transparent hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> Personal Details
          </button>
          <button
            onClick={() => setActiveTab("career")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none ${
              activeTab === "career"
                ? "border-purple-500 text-purple-400"
                : "border-transparent hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" /> Career & Learning
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none ${
              activeTab === "settings"
                ? "border-purple-500 text-purple-400"
                : "border-transparent hover:text-white"
            }`}
          >
            <Layout className="w-4 h-4" /> Workspace Settings
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap focus:outline-none ${
              activeTab === "help"
                ? "border-purple-500 text-purple-400"
                : "border-transparent hover:text-white"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Help Center
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 lg:p-8">
          
          {/* Details Tab */}
          {activeTab === "details" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">College / University</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={profile.college} 
                      onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                      placeholder="Harvard University"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Department / Major</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={profile.department} 
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                      placeholder="Computer Science"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Semester / Year</label>
                  <input 
                    type="text" 
                    value={profile.semester} 
                    onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="Semester 6 / Year 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile Bio</label>
                <textarea 
                  rows={3}
                  value={profile.bio} 
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Expertise Skills</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    className="flex-grow px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="React, Python, AWS..."
                  />
                  <button 
                    onClick={addSkill}
                    className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08] font-semibold transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.skills.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-[#0f0f1a] border border-white/[0.06] rounded-lg text-white">
                      {s}
                      <button onClick={() => removeSkill(idx)} className="text-slate-500 hover:text-red-400 focus:outline-none transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Study Interests</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addInterest()}
                    className="flex-grow px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="Calculus, Machine Learning..."
                  />
                  <button 
                    onClick={addInterest}
                    className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08] font-semibold transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.study_interests.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 bg-[#0f0f1a] border border-white/[0.06] rounded-lg text-white">
                      {s}
                      <button onClick={() => removeInterest(idx)} className="text-slate-500 hover:text-red-400 focus:outline-none transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Social Links</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={profile.github_url} 
                      onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                      placeholder="GitHub URL"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={profile.linkedin_url} 
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={profile.portfolio_url} 
                      onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                      placeholder="Portfolio URL"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Career Tab */}
          {activeTab === "career" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Company</label>
                  <input 
                    type="text" 
                    value={profile.target_company} 
                    onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="Google, Stripe, Microsoft"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Job Role</label>
                  <input 
                    type="text" 
                    value={profile.target_role} 
                    onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Learning Style</label>
                  <select
                    value={profile.learning_style}
                    onChange={(e) => setProfile({ ...profile, learning_style: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all appearance-none"
                  >
                    <option value="">Select style...</option>
                    <option value="Visual">Visual (Charts, Videos)</option>
                    <option value="Auditory">Auditory (Lectures, Podcasts)</option>
                    <option value="Kinesthetic">Kinesthetic (Playgrounds, Labs)</option>
                    <option value="Reading/Writing">Reading & Writing (Textbooks, Notes)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Career Goals</label>
                <textarea 
                  rows={4}
                  value={profile.goals} 
                  onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all resize-none"
                  placeholder="Describe your career goals and what you aim to achieve..."
                />
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Assistant Model</label>
                  <p className="text-sm text-slate-500 mb-2">Select the underlying model to power your study assistant.</p>
                  <select
                    value={profile.ai_model}
                    onChange={(e) => setProfile({ ...profile, ai_model: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all appearance-none"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                    <option value="gpt-4o">GPT-4o (High reasoning)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Language Settings</label>
                  <p className="text-sm text-slate-500 mb-2">Set your default workspace language.</p>
                  <select
                    className="w-full px-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all appearance-none"
                    defaultValue="English"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Hindi">Hindi (India)</option>
                    <option value="Spanish">Spanish (Latin America)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="French">French (Français)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notifications</h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-500 bg-[#0f0f1a] border-white/[0.06]" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Enable daily challenge streaking notifications alerts</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-500 bg-[#0f0f1a] border-white/[0.06]" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Receive email digests of weekly performance reports</span>
                  </label>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
                <h5 className="text-sm font-bold text-red-400 uppercase tracking-wide">Danger Zone</h5>
                <p className="text-sm text-slate-400">Resetting metrics or deleting accounts cannot be undone. All notes, textbook RAG outlines, and achievements will be permanently purged.</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => addToast("Metrics Reset", "Your Study Streak and Coins balance was reset successfully.", "success")}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all"
                  >
                    Reset Streak & Coins
                  </button>
                  <button
                    onClick={() => addToast("Profile Deleted", "Demonstration account deletion successfully simulated.", "success")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* Help Tab */}
          {activeTab === "help" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="space-y-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Frequently Asked Questions</h5>
                <div className="border border-white/[0.06] rounded-xl bg-[#0f0f1a] divide-y divide-white/[0.06]">
                  {[
                    { q: "How do I sync my own OpenAI key?", a: "Go to Settings -> Preferences, input your key, and save. Requests will bypass standard developer limitations." },
                    { q: "What is Spaced Repetition Flashcards?", a: "Our flashcard cards module registers review histories. Cards with lower scores are resurfaced frequently to enhance retention." },
                    { q: "Is textbook PDF data safe?", a: "Yes. StudySphere AI stores RAG textbooks outlines locally per authenticated student profile session." }
                  ].map((faq, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <strong className="text-sm text-white block">{faq.q}</strong>
                      <p className="text-sm text-slate-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Keyboard Shortcuts Reference</h5>
                <div className="border border-white/[0.06] rounded-xl bg-[#0f0f1a] divide-y divide-white/[0.06]">
                  {[
                    { action: "Open Global Search Command Palette", key: "Ctrl + K" },
                    { action: "Save Notes Markdown draft", key: "Ctrl + S" },
                    { action: "Toggle Sidebar Panel Collapse", key: "Ctrl + \\" },
                    { action: "Close Dialog Overlays", key: "Esc" }
                  ].map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-slate-300">{s.action}</span>
                      <kbd className="font-mono text-xs px-2 py-1 bg-[#161625] border border-white/[0.06] rounded text-slate-400">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Sticky Save Bar */}
        <div className="sticky bottom-0 bg-[#161625] border-t border-white/[0.06] p-4 lg:px-8 flex justify-end gap-4 z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08] font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload Avatar"}
          </button>
          
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Preset Avatar Modal */}
      <AnimatePresence>
        {showAvatarDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAvatarDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#161625] border border-white/[0.06] rounded-2xl max-w-lg w-full p-6 shadow-2xl z-50"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Choose Avatar Preset</h3>
                <button 
                  onClick={() => setShowAvatarDialog(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {presetAvatars.map((url) => {
                  const isSelected = profile.avatar === url;
                  return (
                    <div 
                      key={url}
                      onClick={() => handleSelectPresetAvatar(url)}
                      className={`relative aspect-square rounded-full cursor-pointer overflow-hidden border-2 transition-all p-1 flex items-center justify-center bg-[#0f0f1a] ${
                        isSelected ? "border-purple-500 scale-105 shadow-lg shadow-purple-500/20" : "border-transparent hover:border-white/[0.2] hover:scale-105"
                      }`}
                    >
                      <img src={url} alt="preset-avatar" className="w-full h-full object-cover rounded-full" />
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 bg-purple-500 text-white rounded-full p-1 border-2 border-[#161625]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
