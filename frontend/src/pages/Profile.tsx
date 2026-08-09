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
  BookOpen,
  Camera,
  Check,
  Save,
  Loader2,
  Layout,
  Briefcase,
  HelpCircle,
  X
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
  "Bronze Scholar": "bg-amber-600/10 text-amber-600 border-amber-600/20",
  "Silver Scholar": "bg-slate-400/10 text-slate-400 border-slate-400/20",
  "Gold Scholar": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "Level 5 Veteran": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "Intellect Sovereign": "bg-purple-500/10 text-purple-500 border-purple-500/20"
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
      <div className="flex-grow flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <p className="text-sm text-slate-450">Profile not loaded.</p>
      </div>
    );
  }

  const completionPercent = calculateCompletion();

  return (
    <div className="flex-grow p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full overflow-y-auto">
      
      {/* Header bar and Profile Completion */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Settings</h2>
          <p className="text-xs text-slate-450 mt-1">Configure your personal SaaS credentials and study targets.</p>
        </div>
        
        {/* Profile Completion Bar */}
        <div className="w-full sm:w-64 border border-white/5 bg-[#12131A] rounded-2xl p-4 space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-400">PROFILE COMPLETION</span>
            <span className="text-indigo-500">{completionPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Avatar + Level + Badges) */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Avatar Panel */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl flex flex-col items-center text-center gap-4 relative group">
            <div className="relative w-28 h-28 rounded-full border-2 border-indigo-500/20 overflow-hidden bg-indigo-500/5 flex items-center justify-center font-bold text-3xl text-indigo-500 shadow-md">
              {profile.avatar ? (
                profile.avatar.startsWith("/") || profile.avatar.startsWith("http") ? (
                  <img src={profile.avatar.startsWith("/") ? `${api.defaults.baseURL}${profile.avatar}` : profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl select-none animate-float-robot">{profile.avatar}</span>
                )
              ) : (
                profile.name.split(" ").map(w => w[0]).join("").toUpperCase()
              )}
              <div 
                onClick={() => setShowAvatarDialog(true)}
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">{profile.name}</h3>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-slate-250 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-900 hover:bg-slate-150 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-400 transition-colors w-full"
            >
              {uploading ? "Uploading..." : "Upload Custom Photo"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          {/* Gamification Level & XP Progress Card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Learning Level
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                LEVEL {profile.level}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-450">
                <span>XP PROGRESS</span>
                <span>{profile.xp_points % 200} / 200 XP</span>
              </div>
              <div className="w-full h-2 bg-slate-150 dark:bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${((profile.xp_points % 200) / 200) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-semibold text-slate-550 dark:text-slate-400 pt-2">
              <span>Total Points: {profile.xp_points} XP</span>
              <span>Virtual Coins: 🪙 {profile.coins}</span>
            </div>
          </div>

          {/* Badges Earned Container */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
              <Award className="w-4 h-4 text-indigo-500" /> Achievement Badges ({profile.badges.length})
            </h4>

            {profile.badges.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-400">
                No badges earned yet. Complete challenges and quizzes to unlock them!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((b) => (
                  <span 
                    key={b} 
                    className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      badgeColors[b] || "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                    }`}
                  >
                    🏆 {b}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Forms) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation header */}
          <div className="flex border-b border-slate-200/50 dark:border-slate-800/40">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 focus:outline-none ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Personal Details
            </button>
            <button
              onClick={() => setActiveTab("career")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 focus:outline-none ${
                activeTab === "career"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Career & Preferences
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 focus:outline-none ${
                activeTab === "settings"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> Workspace Settings
            </button>
            <button
              onClick={() => setActiveTab("help")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 focus:outline-none ${
                activeTab === "help"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Help Center
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl">
            
            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">College / University</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={profile.college} 
                        onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                        placeholder="Harvard University"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Department / Major</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={profile.department} 
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Semester / Year</label>
                    <input 
                      type="text" 
                      value={profile.semester} 
                      onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                      placeholder="Semester 6 / Year 3"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Profile Bio</label>
                  <textarea 
                    rows={3}
                    value={profile.bio} 
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder-slate-655"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Academic Goals</label>
                  <textarea 
                    rows={2}
                    value={profile.goals} 
                    onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder-slate-655"
                    placeholder="Clear my systems engineering exam and land a software role..."
                  />
                </div>

                {/* Skills tags list */}
                <div className="space-y-2 select-none">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Expertise Skills ({profile.skills.length})</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      className="flex-grow px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl outline-none placeholder-slate-655 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="React, Python, AWS..."
                    />
                    <button 
                      onClick={addSkill}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.skills.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-slate-300">
                        {s}
                        <button onClick={() => removeSkill(idx)} className="text-slate-500 hover:text-rose-500 font-bold focus:outline-none ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Study Interests tags list */}
                <div className="space-y-2 select-none">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Study Interests ({profile.study_interests.length})</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addInterest()}
                      className="flex-grow px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl outline-none placeholder-slate-655 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Calculus, Cyber forensics, Algorithms..."
                    />
                    <button 
                      onClick={addInterest}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.study_interests.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-slate-300">
                        {s}
                        <button onClick={() => removeInterest(idx)} className="text-slate-500 hover:text-rose-500 font-bold focus:outline-none ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Career & Preferences */}
            {activeTab === "career" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Target Company</label>
                    <input 
                      type="text" 
                      value={profile.target_company} 
                      onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                      placeholder="Google, Stripe, Microsoft"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Target Job Role</label>
                    <input 
                      type="text" 
                      value={profile.target_role} 
                      onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Preferred Learning Style</label>
                    <select
                      value={profile.learning_style}
                      onChange={(e) => setProfile({ ...profile, learning_style: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select style...</option>
                      <option value="Visual">Visual (Charts, Videos)</option>
                      <option value="Auditory">Auditory (Lectures, Podcasts)</option>
                      <option value="Kinesthetic">Kinesthetic (Playgrounds, Labs)</option>
                      <option value="Reading/Writing">Reading & Writing (Textbooks, Notes)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Preferred AI Assistant Model</label>
                    <select
                      value={profile.ai_model}
                      onChange={(e) => setProfile({ ...profile, ai_model: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                      <option value="gpt-4o">GPT-4o (High reasoning)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/5 my-2 pt-4" />

                <div className="space-y-4 select-none">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Social Links</h5>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                      <input 
                        type="text" 
                        value={profile.github_url} 
                        onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div className="relative">
                      <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                      <input 
                        type="text" 
                        value={profile.linkedin_url} 
                        onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={profile.portfolio_url} 
                        onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-650"
                        placeholder="https://portfolio.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === "settings" && (
              <div className="space-y-8 select-none">
                {/* 2. Language Selection */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Language Settings</h5>
                  <p className="text-xs text-slate-400">Set your default workspace language.</p>
                  <select
                    className="w-full px-4 py-2.5 text-xs bg-[#181922] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-bold text-white"
                    defaultValue="English"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Hindi">Hindi (India)</option>
                    <option value="Spanish">Spanish (Latin America)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="French">French (Français)</option>
                  </select>
                </div>

                <div className="border-t border-white/5 my-2" />

                {/* 3. Notification Settings */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Workspace Notifications</h5>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3 text-xs text-slate-400 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-500 border-white/5 focus:ring-indigo-500 bg-[#181922]" />
                      <span>Enable daily challenge streaking notifications alerts</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-400 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-indigo-500 border-white/5 focus:ring-indigo-500 bg-[#181922]" />
                      <span>Receive email digests of weekly performance reports</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-white/5 my-2" />

                {/* 4. Danger Zone */}
                <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                  <h5 className="text-xs font-black text-rose-500 uppercase tracking-wide">Danger Zone</h5>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">Resetting metrics or deleting accounts cannot be undone. All notes, textbook RAG outlines, and achievements will be permanently purged.</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => addToast("Metrics Reset", "Your Study Streak and Coins balance was reset successfully.", "success")}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[10px] font-extrabold uppercase rounded-xl cursor-pointer"
                    >
                      Reset Streak & Coins
                    </button>
                    <button
                      onClick={() => addToast("Profile Deleted", "Demonstration account deletion successfully simulated.", "success")}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase rounded-xl cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Help Center */}
            {activeTab === "help" && (
              <div className="space-y-8">
                {/* 1. FAQs Accordion */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Frequently Asked Questions</h5>
                  <div className="border dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 divide-y dark:divide-slate-850 overflow-hidden">
                    {[
                      { q: "How do I sync my own OpenAI key?", a: "Go to Settings -> Preferences, input your key, and save. Requests will bypass standard developer limitations." },
                      { q: "What is Spaced Repetition Flashcards?", a: "Our flashcard cards module registers review histories. Cards with lower scores are resurfaced frequently to enhance retention." },
                      { q: "Is textbook PDF data safe?", a: "Yes. StudySphere AI stores RAG textbooks outlines locally per authenticated student profile session." }
                    ].map((faq, i) => (
                      <div key={i} className="p-4 space-y-1 text-left">
                        <strong className="text-xs text-slate-800 dark:text-slate-200 block">{faq.q}</strong>
                        <p className="text-[10px] text-slate-450 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/40 my-2" />

                {/* 2. Keyboard Shortcuts Cheat Table */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keyboard Shortcuts Reference</h5>
                  <div className="border dark:border-slate-850 rounded-xl overflow-hidden text-[10px]">
                    <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b dark:border-slate-850 font-bold text-slate-500">
                      <span>Action</span>
                      <span>Shortcut</span>
                    </div>
                    <div className="divide-y dark:divide-slate-850">
                      {[
                        { action: "Open Global Search Command Palette", key: "Ctrl + K" },
                        { action: "Save Notes Markdown draft", key: "Ctrl + S" },
                        { action: "Toggle Sidebar Panel Collapse", key: "Ctrl + \\" },
                        { action: "Close Dialog Overlays", key: "Esc" }
                      ].map((s, idx) => (
                        <div key={idx} className="grid grid-cols-2 px-4 py-2.5 text-slate-600 dark:text-slate-400">
                          <span>{s.action}</span>
                          <kbd className="font-mono text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded w-max">{s.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/40 my-2" />

                {/* 3. Legal policies */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Legal Policies & Releases</h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">StudySphere AI v1.2.0 production deployment conforms to standard student portfolios privacy regulations. For terms details, check our Privacy Policy and Terms of Service.</p>
                </div>
              </div>
            )}

            {/* Save Button Row */}
            <div className="flex justify-end gap-3 border-t border-slate-200/50 dark:border-slate-800/40 mt-6 pt-4">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 active:scale-95 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Settings
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Preset Avatar Selection Modal Dialog */}
      <AnimatePresence>
        {showAvatarDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setShowAvatarDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#181922] border border-white/5 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl z-50 select-none"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Choose Avatar Preset</h3>
                <button 
                  onClick={() => setShowAvatarDialog(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-1">
                {presetAvatars.map((url) => {
                  const isSelected = profile.avatar === url;
                  return (
                    <div 
                      key={url}
                      onClick={() => handleSelectPresetAvatar(url)}
                      className={`relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border-2 transition-all p-1 flex items-center justify-center bg-[#12131A] ${
                        isSelected ? "border-indigo-500 scale-105 shadow-md shadow-indigo-500/20" : "border-transparent hover:border-slate-700 hover:scale-102"
                      }`}
                    >
                      <img src={url} alt="preset-avatar" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 bg-indigo-500 text-white rounded-full p-0.5 border border-slate-950">
                          <Check className="w-2.5 h-2.5" />
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

    </div>
  );
};
