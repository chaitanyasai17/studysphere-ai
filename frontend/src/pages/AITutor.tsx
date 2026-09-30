import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  MessageSquare,
  Plus,
  Pin,
  Trash2,
  Send,
  Loader2,
  Copy,
  RefreshCw,
  Download,
  Search,
  BookOpen,
  HelpCircle,
  Code2,
  Sparkles,
  Star,
  Archive,
  FileText,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Compass,
  Bookmark,
  Bot,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  _id: string;
  title: string;
  mode: string;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  messages: Message[];
  updated_at: string;
}

export const AITutor: React.FC = () => {
  const { addToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reactions, setReactions] = useState<Record<string, string>>({});

  // Sidebar Folder Collapsed States
  const [favsCollapsed, setFavsCollapsed] = useState(false);
  const [recentsCollapsed, setRecentsCollapsed] = useState(false);
  const [archivedCollapsed, setArchivedCollapsed] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load all sessions on mount
  const loadSessions = async (selectId?: string) => {
    try {
      const res = await api.get("/api/ai/chats");
      setSessions(res.data);
      
      const queryId = searchParams.get("id");
      const targetId = selectId || queryId || (res.data.length > 0 ? res.data[0]._id : null);
      
      if (targetId) {
        setActiveSessionId(targetId);
        if (!selectId && queryId) {
          setSearchParams({ id: targetId });
        }
      }
    } catch (e) {
      addToast("Error", "Could not load AI tutor history.", "error");
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Fetch messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/ai/chats/${activeSessionId}`);
        setMessages(res.data.messages || []);
      } catch (e) {
        addToast("Error", "Could not synchronize conversation messages.", "error");
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  // Scroll to bottom on messages update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleStartSession = async (title = "New Study Session", mode = "general") => {
    try {
      const res = await api.post("/api/ai/chats", { title, mode });
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
      setSearchParams({ id: newSession._id });
      addToast("Session Started", `New ${mode.toUpperCase()} session initialized.`, "success");
      // On mobile, auto close sidebar when picking new session
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (e) {
      addToast("Error", "Could not create new session.", "error");
    }
  };

  // Generic Update Session attribute (mode, is_pinned, is_favorite, is_archived)
  const handleUpdateSessionAttribute = async (sId: string, payload: Partial<ChatSession>) => {
    try {
      await api.put(`/api/ai/chats/${sId}`, payload);
      setSessions(prev =>
        prev.map(s => s._id === sId ? { ...s, ...payload } : s)
      );
      addToast("Updated", "Conversation options synchronized.", "success");
    } catch (e) {
      addToast("Error", "Failed to update session attributes.", "error");
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sId: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/ai/chats/${sId}`);
      addToast("Deleted", "Chat session removed.", "success");
      
      const remaining = sessions.filter((s) => s._id !== sId);
      setSessions(remaining);
      if (activeSessionId === sId) {
        const nextId = remaining.length > 0 ? remaining[0]._id : null;
        setActiveSessionId(nextId);
        if (nextId) setSearchParams({ id: nextId });
        else setSearchParams({});
      }
    } catch (err) {
      addToast("Error", "Could not delete chat session.", "error");
    }
  };

  const handleSendMessage = async (textToSend: string, isRegenerating = false) => {
    if (!textToSend.trim() || !activeSessionId || loading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    
    const userMsg: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    };
    
    if (!isRegenerating) {
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const res = await api.post(`/api/ai/chats/${activeSessionId}/message`, {
        message: textToSend
      });
      
      const { assistant_message, chat_title } = res.data;
      const fullContent = assistant_message.content;
      
      const initialAssistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: assistant_message.timestamp || new Date().toISOString()
      };
      
      setMessages((prev) => [...prev, initialAssistantMsg]);
      
      setSessions((prev) =>
        prev.map((s) =>
          s._id === activeSessionId
            ? { ...s, title: chat_title || s.title, updated_at: new Date().toISOString() }
            : s
        )
      );

      const words = fullContent.split(" ");
      let currentIdx = 0;
      let currentText = "";
      
      const timer = setInterval(() => {
        if (currentIdx >= words.length) {
          clearInterval(timer);
          setLoading(false);
          setMessages((prev) => [...prev.slice(0, -1), assistant_message]);
          return;
        }
        
        currentText += (currentIdx === 0 ? "" : " ") + words[currentIdx];
        currentIdx++;
        
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...initialAssistantMsg, content: currentText }
        ]);
      }, 25);

    } catch (e: any) {
      const msg = e.response?.data?.message || "AI response failed. Verify LLM configuration.";
      addToast("Failed", msg, "error");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || loading) return;
    const lastUserMsgIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserMsgIdx === -1) return;
    
    const actualIdx = messages.length - 1 - lastUserMsgIdx;
    const lastUserQuery = messages[actualIdx].content;
    
    setMessages((prev) => prev.slice(0, actualIdx + 1));
    await handleSendMessage(lastUserQuery, true);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Copied", "Copied to clipboard.", "success");
  };

  // Action Converters
  const handleSaveToNotes = async (content: string) => {
    try {
      const session = sessions.find(s => s._id === activeSessionId);
      const title = session ? `AI Note: ${session.title}` : "AI Lesson Note";
      await api.post("/api/ai/action/save-note", { content, title });
      addToast("Saved", "Saved directly to study Notes workspace!", "success");
    } catch (err) {
      addToast("Error", "Could not save to notes.", "error");
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      const session = sessions.find(s => s._id === activeSessionId);
      const subject = session ? session.title : "AI Lesson Concept";
      await api.post("/api/ai/action/generate-quiz", { subject });
      addToast("Quiz Generated", "A practice quiz has been added to your Dashboard!", "success");
    } catch (err) {
      addToast("Error", "Could not generate quiz.", "error");
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      const session = sessions.find(s => s._id === activeSessionId);
      const subject = session ? session.title : "AI Lesson Concept";
      await api.post("/api/ai/action/generate-flashcards", { subject });
      addToast("Flashcard Created", "Flashcards added to study deck!", "success");
    } catch (err) {
      addToast("Error", "Could not generate flashcards.", "error");
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const activeSession = sessions.find((s) => s._id === activeSessionId);
    const title = activeSession?.title || "StudySphere Chat";
    
    let content = `# StudySphere AI Chat Session: ${title}\n\n`;
    messages.forEach((m) => {
      content += `### **${m.role.toUpperCase()}** (${new Date(m.timestamp).toLocaleString()})\n\n${m.content}\n\n---\n\n`;
    });
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_session.md`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Exported", "Chat exported as Markdown file.", "success");
  };

  // Helper to render inline markdown styles like bold, inline code, citations
  const renderInlineTokens = (text: string) => {
    if (!text) return "";
    
    const codeParts = text.split(/`([^`]+)`/g);
    return codeParts.map((codePart, codeIdx) => {
      if (codeIdx % 2 === 1) {
        return (
          <code key={codeIdx} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-xs border border-purple-500/20">
            {codePart}
          </code>
        );
      }
      
      const boldParts = codePart.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((boldPart, boldIdx) => {
        if (boldIdx % 2 === 1) {
          return (
            <strong key={boldIdx} className="font-semibold text-white">
              {renderCitations(boldPart)}
            </strong>
          );
        }
        return <span key={boldIdx} className="text-slate-100">{renderCitations(boldPart)}</span>;
      });
    });
  };

  const renderCitations = (text: string) => {
    if (!text) return "";
    const citationParts = text.split(/(\[\d+\])/g);
    return citationParts.map((part, idx) => {
      if (idx % 2 === 1) {
        const num = part.replace(/[\[\]]/g, "");
        return (
          <sup key={idx}>
            <span 
              onClick={() => {
                addToast("Citation Source", `Verified source reference #${num} verified from ingested notebook.`, "info");
              }}
              className="px-1 bg-purple-500/20 text-purple-300 rounded font-bold hover:bg-purple-500/40 transition-colors cursor-pointer select-none text-[10px]"
            >
              [{num}]
            </span>
          </sup>
        );
      }
      return part;
    });
  };

  const renderMarkdown = (txt: string) => {
    const parts = txt.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const lines = part.split("\n");
        const lang = lines[0].replace("```", "").trim() || "code";
        const code = lines.slice(1, -1).join("\n");
        
        const highlightCode = (rawCode: string) => {
          return rawCode.split("\n").map((line, lineIdx) => {
            const tokens = line.split(/(\b(?:const|let|var|function|return|import|export|from|class|if|else|for|while|async|await|try|catch|new|def|class|print)\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/.*|\b\d+\b)/g);
            return (
              <div key={lineIdx} className="min-h-[1.25rem]">
                {tokens.map((token, tokenIdx) => {
                  if (/^(?:const|let|var|function|return|import|export|from|class|if|else|for|while|async|await|try|catch|new|def|class|print)$/.test(token)) {
                    return <span key={tokenIdx} className="text-pink-400 font-medium">{token}</span>;
                  }
                  if (/^["'].*["']$/.test(token)) {
                    return <span key={tokenIdx} className="text-emerald-400">{token}</span>;
                  }
                  if (/^\/\/.*$/.test(token) || token.startsWith("/*")) {
                    return <span key={tokenIdx} className="text-slate-500 italic">{token}</span>;
                  }
                  if (/^\d+$/.test(token)) {
                    return <span key={tokenIdx} className="text-amber-400">{token}</span>;
                  }
                  return token;
                })}
              </div>
            );
          });
        };

        return (
          <div key={i} className="my-4 border border-white/[0.08] rounded-xl overflow-hidden bg-[#0a0a12] max-w-full">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161625] border-b border-white/[0.08] text-xs text-slate-400 font-mono select-none">
              <span>{lang.toUpperCase()}</span>
              <button
                onClick={() => handleCopyText(code)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-slate-400"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed bg-[#0a0a12]">
              <code>{highlightCode(code)}</code>
            </pre>
          </div>
        );
      }
      
      const lines = part.split("\n");
      return (
        <div key={i} className="space-y-3">
          {lines.map((line, idx) => {
            if (line.startsWith("### ")) {
              return <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-2 tracking-wide">{renderInlineTokens(line.replace("### ", ""))}</h4>;
            }
            if (line.startsWith("## ")) {
              return <h3 key={idx} className="text-base font-bold text-white mt-5 mb-2 pb-1 border-b border-white/[0.06]">{renderInlineTokens(line.replace("## ", ""))}</h3>;
            }
            if (line.startsWith("# ")) {
              return <h2 key={idx} className="text-lg font-bold text-white mt-6 mb-3 pb-2 border-b border-white/[0.08]">{renderInlineTokens(line.replace("# ", ""))}</h2>;
            }
            if (line.startsWith("> ")) {
              return (
                <blockquote key={idx} className="border-l-2 border-purple-500/50 pl-3 my-2 text-slate-300 italic text-sm">
                  {renderInlineTokens(line.replace(/^>\s*/, ""))}
                </blockquote>
              );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              return (
                <ul key={idx} className="list-disc pl-6 text-sm text-slate-100 space-y-1">
                  <li>{renderInlineTokens(cleanLine)}</li>
                </ul>
              );
            }
            if (/^\d+\.\s+/.test(line)) {
              const cleanLine = line.replace(/^\d+\.\s+/, "");
              const num = line.match(/^\d+/)?.[0] || "1";
              return (
                <ol key={idx} className="list-decimal pl-6 text-sm text-slate-100 space-y-1">
                  <li value={parseInt(num)}>{renderInlineTokens(cleanLine)}</li>
                </ol>
              );
            }
            
            return line.trim() ? (
              <p key={idx} className="text-sm leading-relaxed text-slate-100">{renderInlineTokens(line)}</p>
            ) : <div key={idx} className="h-2" />;
          })}
        </div>
      );
    });
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(messageSearch.toLowerCase())
  );

  const activeSession = sessions.find(s => s._id === activeSessionId);
  const activeMode = activeSession?.mode || "general";

  // Dynamic suggested prompts matching the active mode selection
  const modeSuggestions: Record<string, { title: string; text: string; icon: React.ReactNode }[]> = {
    general: [
      { title: "Explain Concept", text: "Explain the concept of quantum computing in simple terms.", icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
      { title: "Summarize Topic", text: "Summarize the key takeaways of carbon cycle biology.", icon: <BookOpen className="w-5 h-5 text-emerald-400" /> },
      { title: "Study Plan", text: "Create a 4-week study plan for mastering React fundamentals.", icon: <Layers className="w-5 h-5 text-cyan-400" /> },
      { title: "Practice Questions", text: "Generate 5 practice questions about World War II history.", icon: <HelpCircle className="w-5 h-5 text-pink-400" /> }
    ],
    programming: [
      { title: "Algorithm Analysis", text: "Explain time complexity of quicksort and write a Python sample.", icon: <Code2 className="w-5 h-5 text-purple-400" /> },
      { title: "Debug Logic", text: "Explain recursion logic vs loops in factorial scripts.", icon: <RefreshCw className="w-5 h-5 text-blue-400" /> }
    ],
    cyber: [
      { title: "Vulnerability Check", text: "Explain SQL Injection vulnerabilities and secure parameterizations.", icon: <ShieldCheck className="w-5 h-5 text-rose-400" /> },
      { title: "Cryptography", text: "Explain how public/private keys exchange values securely in RSA.", icon: <HelpCircle className="w-5 h-5 text-amber-400" /> }
    ],
    resume: [
      { title: "Improve Project", text: "Improve the project description bullets for my React application.", icon: <FileText className="w-5 h-5 text-purple-400" /> },
      { title: "Optimize Skills", text: "Suggest cloud engineer CV skills for ATS optimization.", icon: <Layers className="w-5 h-5 text-teal-400" /> }
    ],
    interview: [
      { title: "Mock Interview", text: "Conduct a mock interview for a Junior Front-end Engineer position.", icon: <Briefcase className="w-5 h-5 text-blue-400" /> },
      { title: "Behavioral Questions", text: "Give me common HR behavioral questions and STAR method templates.", icon: <Compass className="w-5 h-5 text-purple-400" /> }
    ],
    career: [
      { title: "Career Roadmap", text: "Provide a detailed study roadmap to become a SOC Analyst.", icon: <Compass className="w-5 h-5 text-amber-400" /> },
      { title: "Portfolio Ideas", text: "What projects should I build to show proficiency in backend architecture?", icon: <BookOpen className="w-5 h-5 text-purple-400" /> }
    ]
  };

  const suggestedPrompts = modeSuggestions[activeMode] || modeSuggestions["general"];

  // Sidebar Filtering lists
  const favoriteSessions = filteredSessions.filter(s => s.is_favorite && !s.is_archived);
  const recentSessions = filteredSessions.filter(s => !s.is_favorite && !s.is_archived);
  const archivedSessions = filteredSessions.filter(s => s.is_archived);

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-[#0a0a12] text-white overflow-hidden -m-6 w-[calc(100%+3rem)]">
      
      {/* Session Side List Drawer */}
      <div 
        className={`${sidebarOpen ? "w-full md:w-[280px]" : "w-0"} flex-shrink-0 border-r border-white/[0.04] transition-all duration-300 flex flex-col overflow-hidden bg-[#0c0c16] z-20 absolute md:relative h-full`}
      >
        <div className="p-4 border-b border-white/[0.04] space-y-4">
          <button
            onClick={() => handleStartSession("New Chat", "general")}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Sessions Category Stack */}
        <div className="flex-grow overflow-y-auto p-3 space-y-6">
          
          {/* CATEGORY 1: Favorites */}
          {favoriteSessions.length > 0 && (
            <div>
              <button 
                onClick={() => setFavsCollapsed(!favsCollapsed)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider hover:text-slate-300 px-2 py-1 mb-1 transition-colors"
              >
                <span>Favorites ({favoriteSessions.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${favsCollapsed ? "" : "rotate-90"}`} />
              </button>
              {!favsCollapsed && (
                <div className="space-y-1">
                  {favoriteSessions.map(session => (
                    <div
                      key={session._id}
                      onClick={() => {
                        setActiveSessionId(session._id);
                        setSearchParams({ id: session._id });
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border-l-2 ${
                        session._id === activeSessionId
                          ? "bg-purple-500/10 border-purple-500 text-white"
                          : "border-transparent hover:bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${session._id === activeSessionId ? "text-purple-400" : "text-slate-500"}`} />
                        <span className="text-sm truncate font-medium">
                          {session.title}
                        </span>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_favorite: false }); }}
                          className="p-1 rounded text-yellow-500 hover:bg-white/10"
                          title="Unfavorite"
                        >
                          <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORY 2: Recent Chats */}
          <div>
            <button 
              onClick={() => setRecentsCollapsed(!recentsCollapsed)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider hover:text-slate-300 px-2 py-1 mb-1 transition-colors"
            >
              <span>Recent Chats ({recentSessions.length})</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${recentsCollapsed ? "" : "rotate-90"}`} />
            </button>
            {!recentsCollapsed && (
              <div className="space-y-1">
                {recentSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => {
                      setActiveSessionId(session._id);
                      setSearchParams({ id: session._id });
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border-l-2 ${
                      session._id === activeSessionId
                        ? "bg-purple-500/10 border-purple-500 text-white"
                        : "border-transparent hover:bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${session._id === activeSessionId ? "text-purple-400" : "text-slate-500"}`} />
                      <span className="text-sm truncate font-medium">
                        {session.title}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_favorite: true }); }}
                        className="p-1.5 rounded text-slate-400 hover:text-yellow-500 hover:bg-white/10"
                        title="Add to Favorites"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_archived: true }); }}
                        className="p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-white/10"
                        title="Archive Chat"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, session._id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY 3: Archived */}
          {archivedSessions.length > 0 && (
            <div>
              <button 
                onClick={() => setArchivedCollapsed(!archivedCollapsed)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider hover:text-slate-300 px-2 py-1 mb-1 transition-colors"
              >
                <span>Archived ({archivedSessions.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${archivedCollapsed ? "" : "rotate-90"}`} />
              </button>
              {!archivedCollapsed && (
                <div className="space-y-1">
                  {archivedSessions.map(session => (
                    <div
                      key={session._id}
                      onClick={() => {
                        setActiveSessionId(session._id);
                        setSearchParams({ id: session._id });
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border-l-2 ${
                        session._id === activeSessionId
                          ? "bg-purple-500/10 border-purple-500 text-white"
                          : "border-transparent hover:bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${session._id === activeSessionId ? "text-purple-400" : "text-slate-500"}`} />
                        <span className="text-sm truncate font-medium">
                          {session.title}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_archived: false }); }}
                          className="p-1.5 rounded text-purple-400 hover:bg-white/10"
                          title="Unarchive"
                        >
                          <Archive className="w-3.5 h-3.5 fill-purple-500/20" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(e, session._id)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Message Chat Frame */}
      <div className="flex-grow flex flex-col relative min-w-0 bg-[#0a0a12] h-full">
        
        {/* Active Session Header details */}
        <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-colors hidden md:block"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-colors md:hidden"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-[300px]">
                  {sessions.find((s) => s._id === activeSessionId)?.title || "AI Tutor"}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-medium">GPT-4 Optimized</span>
                </div>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Find in chat..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-white/[0.06] bg-[#0f0f1a] text-sm text-white placeholder:text-slate-500 outline-none w-32 focus:w-48 transition-all focus:border-purple-500/50"
                />
              </div>
              <button
                onClick={handleExportChat}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-colors border border-white/[0.04]"
                title="Export Conversation"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Mode Switcher Toolbar */}
        {activeSessionId && (
          <div className="px-4 md:px-6 py-3 bg-[#0a0a12] border-b border-white/[0.04] overflow-x-auto flex gap-2 flex-shrink-0 scrollbar-none">
            {[
              { id: "general", label: "General", icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: "programming", label: "Programming", icon: <Code2 className="w-3.5 h-3.5" /> },
              { id: "cyber", label: "Security", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
              { id: "resume", label: "Resume", icon: <FileText className="w-3.5 h-3.5" /> },
              { id: "interview", label: "Interview", icon: <Briefcase className="w-3.5 h-3.5" /> },
              { id: "career", label: "Career Guidance", icon: <Compass className="w-3.5 h-3.5" /> }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleUpdateSessionAttribute(activeSessionId, { mode: m.id })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeMode === m.id
                    ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                    : "bg-[#161625] border border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:text-slate-300"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages Stack Scroll */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-10 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative">
                <div className="absolute inset-0 rounded-3xl bg-purple-500/20 blur-xl"></div>
                <Sparkles className="w-10 h-10 text-purple-400 relative z-10" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Hello! I'm your AI learning assistant</h2>
              <p className="text-sm md:text-base text-slate-400 mb-10 max-w-xl">
                I can explain complex concepts, solve tricky problems, generate study materials, or help you debug code. What would you like to learn today?
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-[#161625] border border-white/[0.06] hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.05)] text-left hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] group-hover:bg-purple-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">{p.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            (messageSearch ? filteredMessages : messages).map((m, idx) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 md:gap-5 max-w-4xl mx-auto w-full ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 border bg-[#161625] border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] mt-1">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  )}

                  <div className={`p-4 md:p-5 rounded-3xl space-y-3 max-w-[85%] md:max-w-[80%] ${
                    isAssistant
                      ? "bg-[#161625] border border-white/[0.06] rounded-tl-sm"
                      : "bg-purple-500/20 border border-purple-500/20 text-white rounded-tr-sm"
                  }`}>
                    {/* Render message formatting */}
                    <div className="text-sm leading-relaxed break-words text-slate-100">
                      {isAssistant ? renderMarkdown(m.content) : <p className="whitespace-pre-wrap">{m.content}</p>}
                    </div>

                    {isAssistant && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3 mt-4 text-xs text-slate-400">
                        <button
                          onClick={() => handleCopyText(m.content)}
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                        
                        <button
                          onClick={() => handleSaveToNotes(m.content)}
                          className="flex items-center gap-1.5 hover:text-purple-300 text-purple-400 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Save Note
                        </button>

                        <button
                          onClick={handleGenerateQuiz}
                          className="flex items-center gap-1.5 hover:text-emerald-300 text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" /> Quiz
                        </button>

                        <button
                          onClick={handleGenerateFlashcards}
                          className="flex items-center gap-1.5 hover:text-teal-300 text-teal-400 transition-colors cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Flashcard
                        </button>

                        {idx === messages.length - 1 && (
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Retry
                          </button>
                        )}

                        <div className="flex items-center gap-1 select-none border-l border-white/[0.08] pl-3 ml-1">
                          {["👍", "👎"].map((emoji) => {
                            const isSelected = reactions[`${activeSessionId}-${idx}`] === emoji;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setReactions(prev => ({
                                    ...prev,
                                    [`${activeSessionId}-${idx}`]: isSelected ? "" : emoji
                                  }));
                                  if (!isSelected) addToast("Feedback", `Marked with ${emoji}`, "success");
                                }}
                                className={`px-2 py-1 rounded-lg text-sm transition-all cursor-pointer ${
                                  isSelected ? "bg-white/10 scale-110" : "bg-transparent opacity-60 hover:opacity-100 hover:bg-white/5"
                                }`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#161625] border border-white/[0.08] text-slate-300 mt-1">
                      <User className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Loading anim */}
          {loading && (messages.length === 0 || messages[messages.length - 1].role !== "assistant" || messages[messages.length - 1].content === "") && (
            <div className="flex gap-3 md:gap-5 max-w-4xl mx-auto w-full justify-start">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 border bg-[#161625] border-purple-500/30 text-purple-400 mt-1">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
              </div>
              <div className="p-4 rounded-3xl bg-[#161625] border border-white/[0.06] rounded-tl-sm flex items-center gap-2 h-12 w-24 justify-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input panel block */}
        <div className="p-4 md:p-6 border-t border-white/[0.06] bg-[#0a0a12] flex-shrink-0 z-10">
          <div className="max-w-4xl mx-auto relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="relative flex items-end gap-3 bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-2 md:p-3 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all shadow-lg"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={activeSessionId ? "Message AI Tutor... (Shift+Enter for new line)" : "Select or create a chat to begin..."}
                disabled={!activeSessionId || loading}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow px-3 py-2 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50 resize-none max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                style={{ minHeight: "40px" }}
              />
              <button
                type="submit"
                disabled={!activeSessionId || !input.trim() || loading}
                className="p-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex-shrink-0 cursor-pointer self-end mb-0.5"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-[10px] text-slate-500">AI Tutor can make mistakes. Verify important information.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
