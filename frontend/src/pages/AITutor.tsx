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
  Bookmark
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

  const handleStartSession = async (title = "New Study Session", mode = "general") => {
    try {
      const res = await api.post("/api/ai/chats", { title, mode });
      const newSession = res.data;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
      setSearchParams({ id: newSession._id });
      addToast("Session Started", `New ${mode.toUpperCase()} session initialized.`, "success");
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
          <code key={codeIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] border border-white/5">
            {codePart}
          </code>
        );
      }
      
      const boldParts = codePart.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((boldPart, boldIdx) => {
        if (boldIdx % 2 === 1) {
          return (
            <strong key={boldIdx} className="font-extrabold text-white">
              {renderCitations(boldPart)}
            </strong>
          );
        }
        return renderCitations(boldPart);
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
              className="px-1 bg-indigo-500/20 text-indigo-300 rounded font-black hover:bg-indigo-500/40 transition-colors cursor-pointer select-none text-[8.5px]"
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
                    return <span key={tokenIdx} className="text-pink-400 font-bold">{token}</span>;
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
          <div key={i} className="my-4 border border-white/5 rounded-2xl overflow-hidden bg-[#0B0B12] shadow-2xl max-w-full">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-white/5 text-[10px] text-slate-400 font-mono select-none">
              <span>{lang.toUpperCase()}</span>
              <button
                onClick={() => handleCopyText(code)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-slate-400"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-200 leading-relaxed bg-[#0F0F16]">
              <code>{highlightCode(code)}</code>
            </pre>
          </div>
        );
      }
      
      const lines = part.split("\n");
      return (
        <div key={i} className="space-y-2">
          {lines.map((line, idx) => {
            if (line.startsWith("### ")) {
              return <h4 key={idx} className="text-xs font-black text-white mt-4 mb-2 tracking-wide uppercase">{line.replace("### ", "")}</h4>;
            }
            if (line.startsWith("## ")) {
              return <h3 key={idx} className="text-sm font-black text-white mt-5 mb-2 border-b border-white/5 pb-1 tracking-wide uppercase">{line.replace("## ", "")}</h3>;
            }
            if (line.startsWith("# ")) {
              return <h2 key={idx} className="text-base font-black text-white mt-6 mb-3 border-b border-white/10 pb-2 tracking-wide uppercase">{line.replace("# ", "")}</h2>;
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              const cleanLine = line.replace(/^[-*]\s+/, "");
              return (
                <ul key={idx} className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                  <li>{renderInlineTokens(cleanLine)}</li>
                </ul>
              );
            }
            if (/^\d+\.\s+/.test(line)) {
              const cleanLine = line.replace(/^\d+\.\s+/, "");
              const num = line.match(/^\d+/)?.[0] || "1";
              return (
                <ol key={idx} className="list-decimal pl-5 text-xs text-slate-300 space-y-1">
                  <li value={parseInt(num)}>{renderInlineTokens(cleanLine)}</li>
                </ol>
              );
            }
            
            return line.trim() ? (
              <p key={idx} className="text-xs leading-relaxed text-slate-300">{renderInlineTokens(line)}</p>
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
      { title: "Define Term", text: "Explain the concept of quantum computing in simple terms.", icon: <Sparkles className="w-4 h-4 text-indigo-500" /> },
      { title: "Summarize Chapter", text: "Summarize the key takeaways of carbon cycle biology.", icon: <BookOpen className="w-4 h-4 text-emerald-500" /> }
    ],
    programming: [
      { title: "quicksort Big-O", text: "Explain time complexity of quicksort and write python sample.", icon: <Code2 className="w-4 h-4 text-indigo-500" /> },
      { title: "Debug Function", text: "Explain recursion logic vs loops in factorial scripts.", icon: <RefreshCw className="w-4 h-4 text-sky-500" /> }
    ],
    cyber: [
      { title: "Define SQLi", text: "Explain SQL Injection vulnerabilities and secure parameterizations.", icon: <ShieldCheck className="w-4 h-4 text-rose-500" /> },
      { title: "RSA Cipher", text: "Explain how public/private keys exchange values securely.", icon: <HelpCircle className="w-4 h-4 text-amber-500" /> }
    ],
    resume: [
      { title: "CV Project Section", text: "Improve the project description bullets for my React application.", icon: <FileText className="w-4 h-4 text-indigo-500" /> },
      { title: "Skills Listing", text: "Suggest cloud engineer CV skills for ATS optimization.", icon: <Layers className="w-4 h-4 text-teal-500" /> }
    ],
    interview: [
      { title: "Junior Dev Prompts", text: "Conduct a mock interview for a Junior Front-end Engineer position.", icon: <Briefcase className="w-4 h-4 text-sky-500" /> },
      { title: "HR Templates", text: "Give me common HR questions and structured answer templates.", icon: <Compass className="w-4 h-4 text-indigo-500" /> }
    ],
    career: [
      { title: "SOC Analyst Roadmap", text: "Provide a detailed study roadmap to become a SOC Analyst.", icon: <Compass className="w-4 h-4 text-orange-500" /> },
      { title: "Backend projects", text: "What projects should I build to show proficiency in backend Blueprints?", icon: <BookOpen className="w-4 h-4 text-indigo-500" /> }
    ]
  };

  const suggestedPrompts = modeSuggestions[activeMode] || modeSuggestions["general"];

  // Sidebar Filtering lists
  const favoriteSessions = filteredSessions.filter(s => s.is_favorite && !s.is_archived);
  const recentSessions = filteredSessions.filter(s => !s.is_favorite && !s.is_archived);
  const archivedSessions = filteredSessions.filter(s => s.is_archived);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex border border-white/5 bg-[#12131A] rounded-3xl overflow-hidden shadow-xl w-full">
      
      {/* Session Side List Drawer */}
      <div className={`${sidebarOpen ? "w-[300px]" : "w-0"} flex-shrink-0 border-r border-white/5 transition-all flex flex-col overflow-hidden bg-[#11121A]`}>
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-850 flex gap-2 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="premium-input w-full pl-8 pr-3"
            />
          </div>
          <button
            onClick={() => handleStartSession("New Session", "general")}
            className="premium-button-primary w-10 h-10 flex items-center justify-center p-0 flex-shrink-0"
            title="New Chat Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions Category Stack */}
        <div className="flex-grow overflow-y-auto p-3 space-y-4">
          
          {/* CATEGORY 1: Favorites */}
          <div>
            <button 
              onClick={() => setFavsCollapsed(!favsCollapsed)}
              className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider hover:text-slate-600 px-2 py-1 focus:outline-none"
            >
              <span>Favorites 🌟 ({favoriteSessions.length})</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${favsCollapsed ? "" : "rotate-90"}`} />
            </button>
            {!favsCollapsed && (
              <div className="space-y-1 mt-1">
                {favoriteSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => {
                      setActiveSessionId(session._id);
                      setSearchParams({ id: session._id });
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      session._id === activeSessionId
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                        : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-grow">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${session._id === activeSessionId ? "text-indigo-500" : "text-slate-400"}`} />
                      <span className={`text-xs truncate ${session._id === activeSessionId ? "font-bold text-slate-850 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                        {session.title}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_favorite: false }); }}
                        className="p-1 rounded text-yellow-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                        title="Unfavorite"
                      >
                        <Star className="w-3 h-3 fill-yellow-500" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, session._id)}
                        className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY 2: Recent Chats */}
          <div>
            <button 
              onClick={() => setRecentsCollapsed(!recentsCollapsed)}
              className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider hover:text-slate-600 px-2 py-1 focus:outline-none"
            >
              <span>Recent Chats 💬 ({recentSessions.length})</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${recentsCollapsed ? "" : "rotate-90"}`} />
            </button>
            {!recentsCollapsed && (
              <div className="space-y-1 mt-1">
                {recentSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => {
                      setActiveSessionId(session._id);
                      setSearchParams({ id: session._id });
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      session._id === activeSessionId
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                        : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-grow">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${session._id === activeSessionId ? "text-indigo-500" : "text-slate-400"}`} />
                      <span className={`text-xs truncate ${session._id === activeSessionId ? "font-bold text-slate-850 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                        {session.title}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_favorite: true }); }}
                        className="p-1 rounded text-slate-400 hover:text-yellow-500"
                        title="Add to Favorites"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_archived: true }); }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-500"
                        title="Archive Chat"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, session._id)}
                        className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY 3: Archived */}
          <div>
            <button 
              onClick={() => setArchivedCollapsed(!archivedCollapsed)}
              className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider hover:text-slate-600 px-2 py-1 focus:outline-none"
            >
              <span>Archived 📁 ({archivedSessions.length})</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${archivedCollapsed ? "" : "rotate-90"}`} />
            </button>
            {!archivedCollapsed && (
              <div className="space-y-1 mt-1">
                {archivedSessions.map(session => (
                  <div
                    key={session._id}
                    onClick={() => {
                      setActiveSessionId(session._id);
                      setSearchParams({ id: session._id });
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      session._id === activeSessionId
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                        : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-grow">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${session._id === activeSessionId ? "text-indigo-500" : "text-slate-400"}`} />
                      <span className={`text-xs truncate ${session._id === activeSessionId ? "font-bold text-slate-850 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                        {session.title}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateSessionAttribute(session._id, { is_archived: false }); }}
                        className="p-1 rounded text-indigo-500 hover:bg-slate-200"
                        title="Unarchive"
                      >
                        <Archive className="w-3 h-3 fill-indigo-500/10" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, session._id)}
                        className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Message Chat Frame */}
      <div className="flex-grow flex flex-col relative min-w-0">
        
        {/* Active Session Header details */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#12131A] backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/40 text-slate-450 hover:text-slate-600 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            <h4 className="text-xs font-bold truncate max-w-[150px] sm:max-w-[300px]">
              {sessions.find((s) => s._id === activeSessionId)?.title || "Active Study Room"}
            </h4>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find in chat..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  className="pl-7 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-[10px] outline-none w-32 focus:w-44 transition-all"
                />
              </div>
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 cursor-pointer"
                title="Export Conversation"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Mode Switcher Toolbar */}
        {activeSessionId && (
          <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950/30 border-b border-slate-200/40 dark:border-slate-850/60 overflow-x-auto flex gap-2 flex-shrink-0 scrollbar-none">
            {[
              { id: "general", label: "General", icon: <Sparkles className="w-3 h-3" /> },
              { id: "programming", label: "Programming", icon: <Code2 className="w-3 h-3" /> },
              { id: "cyber", label: "Security", icon: <ShieldCheck className="w-3 h-3" /> },
              { id: "resume", label: "Resume", icon: <FileText className="w-3 h-3" /> },
              { id: "interview", label: "Interview", icon: <Briefcase className="w-3 h-3" /> },
              { id: "career", label: "Career Guidance", icon: <Compass className="w-3 h-3" /> }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleUpdateSessionAttribute(activeSessionId, { mode: m.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                  activeMode === m.id
                    ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages Stack Scroll */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ask your AI Study Tutor</h3>
                <p className="text-xs text-slate-500">
                  Type questions regarding math derivations, review coding logic, draft outlines, or prepare quiz reviews.
                </p>
              </div>

              {/* Suggestions Cards (Mode specific) */}
              <div className="grid grid-cols-1 gap-3 w-full pt-4">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 hover:border-indigo-500/40 dark:hover:border-indigo-500/25 bg-white dark:bg-slate-900 text-left hover:-translate-y-0.5 transition-all w-full shadow-sm cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center flex-shrink-0">
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{p.title}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 truncate max-w-[250px]">{p.text}</p>
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
                  className={`flex gap-4 max-w-3xl ${
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    isAssistant 
                      ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/10 animate-pulse" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200"
                  }`}>
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : "ME"}
                  </div>

                  <div className={`p-4 rounded-2xl space-y-3 ${
                    isAssistant
                      ? "bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850"
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  }`}>
                    {/* Render message formatting */}
                    <div className="text-xs leading-relaxed break-words">
                      {isAssistant ? renderMarkdown(m.content) : <p className="whitespace-pre-wrap">{m.content}</p>}
                    </div>

                    {isAssistant && (
                      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/50 dark:border-slate-800/40 pt-2.5 mt-2.5 text-[9px] text-slate-400">
                        <button
                          onClick={() => handleCopyText(m.content)}
                          className="flex items-center gap-1 hover:text-slate-600 cursor-pointer focus:outline-none"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        
                        <button
                          onClick={() => handleSaveToNotes(m.content)}
                          className="flex items-center gap-1 hover:text-slate-600 text-indigo-550 cursor-pointer focus:outline-none"
                        >
                          <FileText className="w-3 h-3" /> Save Note
                        </button>

                        <button
                          onClick={handleGenerateQuiz}
                          className="flex items-center gap-1 hover:text-slate-600 text-emerald-550 cursor-pointer focus:outline-none"
                        >
                          <Award className="w-3 h-3" /> Generate Quiz
                        </button>

                        <button
                          onClick={handleGenerateFlashcards}
                          className="flex items-center gap-1 hover:text-slate-600 text-teal-550 cursor-pointer focus:outline-none"
                        >
                          <Bookmark className="w-3 h-3" /> Create Flashcard
                        </button>

                        {idx === messages.length - 1 && (
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="flex items-center gap-1 hover:text-slate-600 cursor-pointer focus:outline-none"
                          >
                            <RefreshCw className="w-3 h-3" /> Regenerate
                          </button>
                        )}

                        <div className="flex items-center gap-1 hover:text-slate-200 select-none border-l border-white/10 pl-3">
                          {["👍", "👎", "💡", "❤️"].map((emoji) => {
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
                                  addToast("Feedback Recorded", `You marked explanation with ${emoji}.`, "success");
                                }}
                                className={`px-1.5 py-0.5 rounded text-[11px] transition-all hover:scale-125 cursor-pointer ${
                                  isSelected ? "bg-indigo-500/20 border border-indigo-500/45 scale-110" : "bg-transparent opacity-50 hover:opacity-100"
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
                </div>
              );
            })
          )}

          {/* Typing Loading anim */}
          {loading && (messages.length === 0 || messages[messages.length - 1].role !== "assistant" || messages[messages.length - 1].content === "") && (
            <div className="flex gap-4 max-w-lg mr-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 border border-indigo-500/10">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="p-4 rounded-2xl bg-[#181922] border border-white/5 flex items-center gap-1.5 h-10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input panel block */}
        <div className="p-4 border-t border-white/5 bg-[#12131A] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={activeSessionId ? "Ask a study question..." : "Select or create a chat session from sidebar"}
              disabled={!activeSessionId || loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!activeSessionId || !input.trim() || loading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:shadow-none hover:shadow-indigo-655/20 transition-all flex-shrink-0 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
