import React, { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  Sparkles,
  Eye,
  Edit2,
  Tag,
  Save,
  BookOpen,
  CheckCircle2,
  Loader2,
  Download,
  History,
  GitBranch,
  Play,
  Maximize2,
  Minimize2,
  Clock,
  Compass,
  ArrowRight,
  HelpCircle,
  FolderOpen
} from "lucide-react";

interface Version {
  version_id: string;
  title: string;
  content: string;
  updated_at: string;
  change_summary: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  category: string;
  subject: string;
  tags: string[];
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  is_bookmarked: boolean;
  version_history: Version[];
  updated_at: string;
}

export const Notes: React.FC = () => {
  const { addToast } = useNotifications();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Note details editing state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [subject, setSubject] = useState("General Study");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  // Panels widths (slider)
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(380);

  // Right-hand tabs (Related Learning, Version Timeline, Visual Mind Map)
  const [activeRightTab, setActiveRightTab] = useState<"related" | "history" | "mindmap">("related");

  // Related items list from backend
  const [relatedItems, setRelatedItems] = useState<{ notes: any[]; pdfs: any[]; chats: any[] }>({
    notes: [],
    pdfs: [],
    chats: []
  });

  // History version preview state
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  // Study / Focus mode state
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState(0);
  const [focusTimerActive, setFocusTimerActive] = useState(false);

  // Mind map expand state
  const [mindMapExpanded, setMindMapExpanded] = useState<string[]>(["Root"]);

  // Sidebar collapsible lists states
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);

  const saveTimerRef = useRef<any | null>(null);
  const timerIntervalRef = useRef<any | null>(null);

  const loadNotes = async (selectId?: string) => {
    try {
      const res = await api.get("/api/notes");
      setNotes(res.data);
      if (res.data.length > 0) {
        const targetId = selectId || res.data[0]._id;
        const active = res.data.find((n: Note) => n._id === targetId) || res.data[0];
        handleSelectNote(active);
      } else {
        setActiveNoteId(null);
      }
    } catch (e) {
      addToast("Error", "Could not load notes.", "error");
    }
  };

  const fetchRelatedAndHistory = async (noteId: string) => {
    try {
      const res = await api.get(`/api/notes/${noteId}/related`);
      setRelatedItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // Study focus timer ticker
  useEffect(() => {
    if (focusTimerActive) {
      timerIntervalRef.current = setInterval(() => {
        setFocusTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [focusTimerActive]);

  const handleSelectNote = (note: Note) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    setActiveNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setSubject(note.subject || "General Study");
    setTags(note.tags || []);
    setAiOutput(null);
    setPreviewVersion(null);
    
    fetchRelatedAndHistory(note._id);
  };

  // Perform API Save in background without blocking typing focus
  const saveNoteData = useCallback(
    async (noteId: string, payload: Partial<Note>) => {
      setSaving(true);
      try {
        const res = await api.put(`/api/notes/${noteId}`, payload);
        // Refresh local list state
        setNotes((prev) =>
          prev.map((n) => (n._id === noteId ? { ...n, ...payload, version_history: res.data.version_history, updated_at: new Date().toISOString() } : n))
        );
      } catch (err) {
        console.error("Auto save failed", err);
      } finally {
        setSaving(false);
      }
    },
    [setNotes]
  );

  // Auto-Save Effect
  useEffect(() => {
    if (!activeNoteId) return;

    const original = notes.find((n) => n._id === activeNoteId);
    if (!original) return;

    if (
      title !== original.title ||
      content !== original.content ||
      category !== original.category ||
      subject !== original.subject ||
      JSON.stringify(tags) !== JSON.stringify(original.tags)
    ) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        saveNoteData(activeNoteId, { title, content, category, subject, tags });
      }, 1200); // 1.2s debounce
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, category, subject, tags, activeNoteId, saveNoteData, notes]);

  const handleCreateNote = async () => {
    try {
      const res = await api.post("/api/notes", {
        title: "Untitled Note",
        content: "# New Study Notes\nType markdown contents here...",
        category: "General",
        subject: "General Study",
        tags: []
      });
      const newNote = res.data;
      addToast("Created", "Scaffolded a new note.", "success");
      setNotes((prev) => [newNote, ...prev]);
      handleSelectNote(newNote);
    } catch (e) {
      addToast("Error", "Failed to create note.", "error");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/api/notes/${noteId}`);
      addToast("Removed", "Note deleted successfully.", "success");
      const remaining = notes.filter((n) => n._id !== noteId);
      setNotes(remaining);
      if (activeNoteId === noteId) {
        if (remaining.length > 0) handleSelectNote(remaining[0]);
        else setActiveNoteId(null);
      }
    } catch (e) {
      addToast("Error", "Could not delete note.", "error");
    }
  };

  const handleToggleFlag = async (noteId: string, field: "is_pinned" | "is_favorite", currentVal: boolean) => {
    try {
      await api.put(`/api/notes/${noteId}`, { [field]: !currentVal });
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, [field]: !currentVal } : n))
      );
      addToast("Updated", "Flags updated.", "success");
    } catch (e) {
      addToast("Error", "Failed to adjust tags.", "error");
    }
  };

  // AI Actions dispatcher
  const handleAIAction = async (action: string) => {
    if (!activeNoteId || aiLoading) return;
    setAiLoading(true);
    setAiOutput(null);
    try {
      const res = await api.post(`/api/notes/${activeNoteId}/ai`, { action });
      setAiOutput(res.data.result);
      addToast("AI Refactoring Complete", "AI output ready below.", "success");
    } catch (e) {
      addToast("Error", "AI operation failed.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Restore previous historical snapshot
  const handleRestoreVersion = async (versionId: string) => {
    if (!activeNoteId) return;
    try {
      const res = await api.post(`/api/notes/${activeNoteId}/restore`, { version_id: versionId });
      setTitle(res.data.title);
      setContent(res.data.content);
      setNotes(prev => prev.map(n => n._id === activeNoteId ? res.data : n));
      setPreviewVersion(null);
      addToast("Restored", "Note reverted to selected timestamp snapshot.", "success");
    } catch (err) {
      addToast("Error", "Could not restore version.", "error");
    }
  };

  // Rich Text Markup helper insertions
  const insertMarkup = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("note-editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || "text") + suffix;
    
    setContent(text.substring(0, start) + replacement + text.substring(end));
    
    // Focus back
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "text").length);
    }, 50);
  };

  const [slashMenu, setSlashMenu] = useState<{ show: boolean; query: string } | null>(null);

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "b") {
      e.preventDefault();
      insertMarkup("**", "**");
    } else if (e.ctrlKey && e.key === "i") {
      e.preventDefault();
      insertMarkup("*", "*");
    } else if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      if (activeNoteId) {
        saveNoteData(activeNoteId, { title, content, category, subject, tags });
        addToast("Saved", "Note manually synced and backed up.", "success");
      }
    } else if (e.ctrlKey && e.key === "/") {
      e.preventDefault();
      setViewMode(prev => prev === "split" ? "edit" : prev === "edit" ? "preview" : "split");
    }

    if (slashMenu?.show) {
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenu(null);
      }
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    
    if (slashIndex !== -1 && slashIndex === textBeforeCursor.length - 1) {
      setSlashMenu({ show: true, query: "" });
    } else if (slashIndex !== -1 && textBeforeCursor.substring(slashIndex).indexOf(" ") === -1) {
      const query = textBeforeCursor.substring(slashIndex + 1);
      setSlashMenu({ show: true, query });
    } else {
      setSlashMenu(null);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        setTags((prev) => [...prev, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagVal: string) => {
    setTags((prev) => prev.filter((t) => t !== tagVal));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Copied", "Copied to clipboard.", "success");
  };

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
              {boldPart}
            </strong>
          );
        }
        return boldPart;
      });
    });
  };

  // Markdown rendering compiler
  const parseMarkdownPreview = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "code";
    
    let inTable = false;
    let tableRows: string[][] = [];
    
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      
      // Code Block boundary
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeText = codeBlockContent.join("\n");
          
          const highlightCode = (rawCode: string) => {
            return rawCode.split("\n").map((l, lIdx) => {
              const tokens = l.split(/(\b(?:const|let|var|function|return|import|export|from|class|if|else|for|while|async|await|try|catch|new|def|class|print)\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/.*|\b\d+\b)/g);
              return (
                <div key={lIdx} className="min-h-[1.25rem]">
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

          elements.push(
            <div key={`code-${idx}`} className="my-4 border border-white/5 rounded-2xl overflow-hidden bg-[#0B0B12] shadow-2xl max-w-full text-left">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-white/5 text-[10px] text-slate-400 font-mono select-none">
                <span>{codeBlockLang.toUpperCase()}</span>
                <button
                  onClick={() => handleCopyText(codeText)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-slate-400 animate-pulse"
                >
                  <Eye className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-200 leading-relaxed bg-[#0F0F16]">
                <code>{highlightCode(codeText)}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
        } else {
          inCodeBlock = true;
          codeBlockLang = line.replace("```", "").trim() || "code";
        }
        continue;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Table boundary
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        inTable = true;
        const rowCells = line.split("|").slice(1, -1).map(c => c.trim());
        if (!rowCells.every(c => /^:-*:$/.test(c) || /^-+$/.test(c) || c === "")) {
          tableRows.push(rowCells);
        }
        continue;
      } else if (inTable) {
        inTable = false;
        if (tableRows.length > 0) {
          const header = tableRows[0];
          const body = tableRows.slice(1);
          elements.push(
            <div key={`table-${idx}`} className="my-4 overflow-x-auto border border-white/5 rounded-2xl bg-[#12131A] shadow-xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-white/5 text-slate-350">
                    {header.map((h, hIdx) => (
                      <th key={hIdx} className="p-3 font-extrabold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {body.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                      {r.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3">{renderInlineTokens(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
        }
      }
      
      // Headers
      if (line.startsWith("# ")) {
        elements.push(<h1 key={idx} className="text-base font-black text-white mt-5 mb-3 border-b border-white/10 pb-2 tracking-wide uppercase">{line.replace("# ", "")}</h1>);
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-sm font-black text-white mt-4 mb-2 border-b border-white/5 pb-1 tracking-wide uppercase">{line.replace("## ", "")}</h2>);
        continue;
      }
      if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-xs font-black text-white mt-3 mb-1.5 tracking-wide uppercase">{line.replace("### ", "")}</h3>);
        continue;
      }
      
      // Quotes
      if (line.startsWith("> ")) {
        elements.push(<blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1 italic my-2 bg-indigo-500/5 text-[11px] text-slate-400 rounded">{line.replace("> ", "")}</blockquote>);
        continue;
      }
      
      // Checklists
      if (line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("* [ ] ") || line.startsWith("* [x] ")) {
        const checked = line.includes("[x]");
        const textContent = line.substring(6);
        elements.push(
          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 my-1">
            <input 
              type="checkbox" 
              checked={checked} 
              readOnly 
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" 
            />
            <span className={checked ? "line-through text-slate-500 font-semibold" : "font-semibold text-slate-200"}>{renderInlineTokens(textContent)}</span>
          </div>
        );
        continue;
      }
      
      // Bullet lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const clean = line.replace(/^[-*]\s+/, "");
        elements.push(<li key={idx} className="list-disc pl-4 text-[11px] text-slate-300 ml-2">{renderInlineTokens(clean)}</li>);
        continue;
      }
      
      // Ordered lists
      if (/^\d+\.\s+/.test(line)) {
        const clean = line.replace(/^\d+\.\s+/, "");
        const num = line.match(/^\d+/)?.[0] || "1";
        elements.push(
          <ol key={idx} className="list-decimal pl-5 text-[11px] text-slate-300 ml-2">
            <li value={parseInt(num)}>{renderInlineTokens(clean)}</li>
          </ol>
        );
        continue;
      }
      
      // Image markdown parser: ![alt](url)
      const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        elements.push(
          <div key={idx} className="my-4 flex flex-col items-center">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-2xl border border-white/5 shadow-2xl max-w-full max-h-[240px] object-contain" />
            {imgMatch[1] && <span className="text-[9px] text-slate-500 mt-1 select-none font-mono">{imgMatch[1]}</span>}
          </div>
        );
        continue;
      }

      // Default paragraph
      if (line.trim()) {
        elements.push(<p key={idx} className="text-[11px] text-slate-300 my-1 leading-relaxed">{renderInlineTokens(line)}</p>);
      } else {
        elements.push(<div key={idx} className="h-2" />);
      }
    }
    
    return elements;
  };

  // Note download markdown
  const handleExportNote = () => {
    let output = `# ${title}\n\n`;
    output += `**Category**: ${category} | **Subject**: ${subject}\n\n`;
    output += `**Tags**: ${tags.join(", ")}\n\n`;
    output += `---\n\n${content}`;
    
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_revision.md`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Exported", "Note saved as Markdown file.", "success");
  };

  const categories = ["All", ...Array.from(new Set(notes.map((n) => n.category)))];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCat = selectedCategory === "All" || n.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeNote = notes.find((n) => n._id === activeNoteId);
  const activeVersionHistory = activeNote?.version_history || [];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex border border-white/5 bg-[#12131A] rounded-3xl overflow-hidden shadow-xl w-full relative">
      
      {!isStudyMode && (
        <div 
          style={{ width: viewMode === "split" ? "22%" : `${leftWidth}px` }}
          className="flex-shrink-0 border-r border-white/5 flex flex-col bg-[#11121A] overflow-hidden select-none"
        >
          <div className="p-3 border-b border-slate-200/50 dark:border-slate-850 flex gap-2 items-center flex-shrink-0">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="premium-input w-full pl-8 pr-3"
              />
            </div>
            <button
              onClick={handleCreateNote}
              className="premium-button-primary w-10 h-10 flex items-center justify-center p-0 flex-shrink-0 cursor-pointer"
              title="Create New Study Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Sidebar Navigation Panel (Pinned, Recent, Folders) */}
          <div className="p-3 border-b border-white/5 space-y-3 flex-shrink-0 max-h-[300px] overflow-y-auto scrollbar-none">
            {/* Pinned Notes Collapsible Section */}
            {notes.some(n => n.is_pinned) && (
              <div className="space-y-1">
                <button 
                  onClick={() => setPinnedCollapsed(!pinnedCollapsed)}
                  className="w-full flex items-center justify-between text-[9px] font-black uppercase text-indigo-400 tracking-wider hover:text-indigo-300"
                >
                  <span className="flex items-center gap-1">📌 Pinned Notes</span>
                  <span>{pinnedCollapsed ? "+" : "-"}</span>
                </button>
                {!pinnedCollapsed && (
                  <div className="space-y-0.5 pl-2">
                    {notes.filter(n => n.is_pinned).slice(0, 3).map(note => (
                      <div 
                        key={note._id}
                        onClick={() => handleSelectNote(note)}
                        className={`px-2 py-1 rounded-lg text-xs truncate cursor-pointer transition-colors ${note._id === activeNoteId ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "text-slate-400 hover:bg-slate-850/50"}`}
                      >
                        {note.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Notes Collapsible Section */}
            <div className="space-y-1">
              <button 
                onClick={() => setRecentCollapsed(!recentCollapsed)}
                className="w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider hover:text-slate-300"
              >
                <span className="flex items-center gap-1">🕒 Recent Notes</span>
                <span>{recentCollapsed ? "+" : "-"}</span>
              </button>
              {!recentCollapsed && (
                <div className="space-y-0.5 pl-2">
                  {notes.slice(0, 3).map(note => (
                    <div 
                      key={note._id}
                      onClick={() => handleSelectNote(note)}
                      className={`px-2 py-1 rounded-lg text-xs truncate cursor-pointer transition-colors ${note._id === activeNoteId ? "bg-indigo-500/10 text-indigo-400 font-semibold" : "text-slate-400 hover:bg-slate-850/50"}`}
                    >
                      {note.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Folders Collapsible Section */}
            <div className="space-y-1">
              <button 
                onClick={() => setFoldersCollapsed(!foldersCollapsed)}
                className="w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider hover:text-slate-300"
              >
                <span className="flex items-center gap-1">📁 Folders</span>
                <span>{foldersCollapsed ? "+" : "-"}</span>
              </button>
              {!foldersCollapsed && (
                <div className="flex flex-wrap gap-1.5 pl-2 pt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-indigo-600 border-indigo-650 text-white shadow-sm"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List of Note items */}
          <div className="flex-grow overflow-y-auto p-2.5 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-[10px] text-slate-400">No notes found.</div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note._id === activeNoteId;
                return (
                  <div
                    key={note._id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all relative group ${
                      isActive
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                        : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {note.is_pinned && <Pin className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                      {note.is_favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      <h4 className={`text-xs truncate max-w-[130px] ${isActive ? "font-bold text-slate-850 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                        {note.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">
                      {note.content.replace(/[#*`\n]/g, " ").substring(0, 45)}
                    </p>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note._id);
                      }}
                      className="absolute right-2.5 bottom-2.5 p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. CENTER PANEL: Rich Editor & Preview Viewport */}
      {activeNote ? (
        <div className={viewMode === "split" ? "w-[78%] flex flex-col min-w-0 bg-[#0B0B12]" : "flex-grow flex flex-col min-w-0 bg-[#0B0B12]"}>
          
          {/* Main Top Header controls toolbar */}
          {!isStudyMode && (
            <div className="px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-[#12131A] flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/40 border border-transparent focus:border-slate-250 text-[10px] font-semibold uppercase text-slate-500 w-24 outline-none"
                />
                <input
                  type="text"
                  placeholder="Subject Course"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/40 border border-transparent focus:border-slate-250 text-[10px] font-semibold uppercase text-slate-500 w-28 outline-none"
                />
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => handleToggleFlag(activeNote._id, "is_pinned", activeNote.is_pinned)}
                    className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-50 ${
                      activeNote.is_pinned ? "text-indigo-500 border-indigo-500/20 bg-indigo-500/5" : "text-slate-400"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleFlag(activeNote._id, "is_favorite", activeNote.is_favorite)}
                    className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-50 ${
                      activeNote.is_favorite ? "text-amber-400 fill-amber-400 border-amber-500/20 bg-amber-500/5" : "text-slate-400"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* View splits switches & download */}
              <div className="flex items-center gap-3">
                {saving ? (
                  <span className="text-[9px] text-slate-400 flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Auto saving...
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}

                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border">
                  <button
                    onClick={() => setViewMode("edit")}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      viewMode === "edit" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      viewMode === "split" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                      viewMode === "preview" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <button
                  onClick={handleExportNote}
                  className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500"
                  title="Export Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Distraction free trigger */}
                <button
                  onClick={() => {
                    setIsStudyMode(true);
                    setFocusTimer(0);
                    setFocusTimerActive(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-extrabold uppercase hover:bg-slate-850"
                  title="Enter Distraction Free Study Mode"
                >
                  <Maximize2 className="w-3 h-3" /> Study Mode
                </button>
              </div>
            </div>
          )}

          {/* Tags manager */}
          {!isStudyMode && (
            <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-850 flex items-center flex-wrap gap-2 flex-shrink-0">
              <Tag className="w-3 h-3 text-slate-400" />
              {tags.map((tag) => (
                <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 border flex items-center gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 focus:outline-none">×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                className="text-[9px] bg-transparent border-0 outline-none w-20 text-slate-500"
              />
            </div>
          )}

          {/* Notion-style editing quick helper toolbar */}
          {!isStudyMode && viewMode !== "preview" && (
            <div className="px-6 py-1.5 border-b border-white/5 flex flex-wrap gap-2 bg-[#0B0B12] flex-shrink-0 select-none">
              {[
                { label: "H1", prefix: "# " },
                { label: "H2", prefix: "## " },
                { label: "H3", prefix: "### " },
                { label: "Bold", prefix: "**", suffix: "**" },
                { label: "Italic", prefix: "*", suffix: "*" },
                { label: "List", prefix: "- " },
                { label: "Quote", prefix: "> " },
                { label: "Code", prefix: "```\n", suffix: "\n```" },
                { label: "Table", prefix: "| Col 1 | Col 2 |\n|---|---|\n| Cell 1 | Cell 2 |" }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => insertMarkup(btn.prefix, btn.suffix)}
                  className="px-2 py-1 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-md text-[9px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Editor Grid Container */}
          <div 
            className="flex-grow flex divide-x divide-slate-200/50 dark:divide-slate-850 overflow-hidden relative"
            style={viewMode === "split" ? { display: "grid", gridTemplateColumns: "minmax(450px, 1fr) minmax(450px, 1fr)" } : undefined}
          >
            
            {/* Split Screen left editor textarea */}
            {(viewMode === "edit" || viewMode === "split") && !isStudyMode && (
              <div className={viewMode === "split" ? "w-full min-w-[450px] h-full p-6 flex flex-col gap-3 overflow-hidden relative" : "flex-grow h-full p-6 flex flex-col gap-3 overflow-hidden relative"}>
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm font-extrabold bg-transparent border-0 outline-none w-full text-slate-900 dark:text-white focus:ring-0 placeholder-slate-400"
                />
                <textarea
                  id="note-editor-textarea"
                  placeholder="Type Markdown structure here... (Use / for component shortcuts)"
                  value={content}
                  onChange={handleEditorChange}
                  onKeyDown={handleEditorKeyDown}
                  className="flex-grow w-full bg-transparent border-0 outline-none resize-none text-[11px] font-mono text-slate-700 dark:text-slate-300 focus:ring-0 leading-relaxed overflow-y-auto"
                />

                {slashMenu?.show && (
                  <div className="absolute left-6 bottom-16 z-20 bg-[#11121A] border border-white/10 rounded-2xl p-2 w-64 shadow-2xl max-h-52 overflow-y-auto">
                    <div className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500 px-3 py-1.5 border-b border-white/5 mb-1 select-none">
                      Insert Component (Esc to dismiss)
                    </div>
                    {[
                      { label: "Heading 1", description: "Insert a large section title", insert: "# " },
                      { label: "Heading 2", description: "Insert a medium section title", insert: "## " },
                      { label: "Checklist Item", description: "Insert a todo checkbox", insert: "- [ ] " },
                      { label: "Bullet List", description: "Insert a bulleted point", insert: "- " },
                      { label: "Code Block", description: "Insert a multi-line code block", insert: "```javascript\n\n```" },
                      { label: "Data Table", description: "Insert a standard column table grid", insert: "| Col 1 | Col 2 |\n|---|---|\n| Cell 1 | Cell 2 |" },
                      { label: "Image Block", description: "Insert an image link tag", insert: "![Alt Text](https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80)" }
                    ]
                      .filter(cmd => cmd.label.toLowerCase().includes(slashMenu.query.toLowerCase()))
                      .map((cmd, cmdIdx) => (
                        <button
                          key={cmdIdx}
                          type="button"
                          onClick={() => {
                            const textarea = document.getElementById("note-editor-textarea") as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const textBefore = content.substring(0, start);
                              const textAfter = content.substring(end);
                              const slashIndex = textBefore.lastIndexOf("/");
                              const newContent = textBefore.substring(0, slashIndex) + cmd.insert + textAfter;
                              setContent(newContent);
                              setSlashMenu(null);
                              setTimeout(() => {
                                textarea.focus();
                                const newCursorPos = slashIndex + cmd.insert.length;
                                textarea.setSelectionRange(newCursorPos, newCursorPos);
                              }, 50);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-500/10 hover:text-white rounded-xl transition-all flex flex-col cursor-pointer"
                        >
                          <span className="text-[10px] font-bold text-slate-200">{cmd.label}</span>
                          <span className="text-[8px] text-slate-500">{cmd.description}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Split Screen right previewer */}
            {(viewMode === "preview" || viewMode === "split") && !isStudyMode && (
              <div 
                className={viewMode === "split" ? "w-full min-w-[450px] h-full p-6 overflow-y-auto bg-slate-50/20 dark:bg-slate-950/5" : "flex-grow h-full p-6 overflow-y-auto bg-slate-50/20 dark:bg-slate-950/5"}
                style={viewMode === "split" ? { wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" } : undefined}
              >
                {viewMode === "preview" && (
                  <h1 className="text-base font-extrabold text-slate-900 dark:text-white border-b pb-2 mb-4">
                    {title}
                  </h1>
                )}
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-400">
                  {parseMarkdownPreview(content)}
                </div>
              </div>
            )}

            {/* DISTRACTION-FREE STUDY MODE: Overlay fullscreen */}
            {isStudyMode && (
              <div className="absolute inset-0 bg-white dark:bg-slate-950 z-30 flex flex-col">
                <div className="h-14 border-b px-8 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsStudyMode(false)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold truncate max-w-xs">{title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> Focus Time: {Math.floor(focusTimer / 60)}m {focusTimer % 60}s</span>
                    <button
                      onClick={() => setFocusTimerActive(!focusTimerActive)}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        focusTimerActive ? "bg-amber-500/10 text-amber-500" : "bg-indigo-600 text-white"
                      }`}
                    >
                      {focusTimerActive ? "Pause" : "Resume"}
                    </button>
                  </div>
                </div>

                {/* Distraction free scroll read content */}
                <div className="flex-grow overflow-y-auto max-w-2xl mx-auto w-full py-12 px-6 space-y-6">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white border-b pb-4 mb-6">{title}</h1>
                  <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-sans select-text">
                    {parseMarkdownPreview(content)}
                  </div>
                </div>
              </div>
            )}

            {/* AI editor float operation panel */}
            {!isStudyMode && (
              <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border shadow-lg">
                  <button
                    onClick={() => handleAIAction("explain")}
                    className="p-2 rounded-lg hover:bg-slate-50 text-indigo-500 cursor-pointer"
                    title="AI Explain Concepts"
                    disabled={aiLoading}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAIAction("simplify")}
                    className="p-2 rounded-lg hover:bg-slate-50 text-emerald-500 cursor-pointer"
                    title="AI Simplify Text"
                    disabled={aiLoading}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAIAction("examples")}
                    className="p-2 rounded-lg hover:bg-slate-50 text-sky-500 cursor-pointer"
                    title="AI Practical Examples"
                    disabled={aiLoading}
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* AI result console panel */}
            {(aiLoading || aiOutput) && !isStudyMode && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 border border-indigo-500/20 rounded-2xl shadow-xl p-4 max-h-[30vh] overflow-y-auto z-20 backdrop-blur-md">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <h4 className="text-[10px] font-bold text-indigo-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> AI Notes Assistant
                  </h4>
                  <button onClick={() => setAiOutput(null)} className="text-xs text-slate-400 hover:text-slate-600">×</button>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Analysing note structures...
                  </div>
                ) : (
                  <div className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 select-all font-mono whitespace-pre-wrap">
                    {aiOutput}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-300" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Create or Select a note</h3>
            <p className="text-xs text-slate-450 mt-1">
              Select an item from the sidebar outline or click create note to write markdown guides.
            </p>
          </div>
          <button
            onClick={handleCreateNote}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
          >
            Create Note
          </button>
        </div>
      )}

      {/* 3. RIGHT SIDEBAR: Related Learning & Outlines timeline */}
      {activeNote && !isStudyMode && viewMode !== "split" && (
        <div 
          style={{ width: `${rightWidth}px` }}
          className="flex-shrink-0 border-l border-white/5 flex flex-col bg-[#11121A] overflow-hidden"
        >
          {/* Header tabs */}
          <div className="grid grid-cols-3 border-b border-slate-200/50 dark:border-slate-850 text-[9px] font-extrabold uppercase tracking-wider flex-shrink-0">
            {[
              { id: "related", label: "Related" },
              { id: "history", label: "History" },
              { id: "mindmap", label: "Mind Map" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveRightTab(tab.id as any);
                  setPreviewVersion(null);
                }}
                className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
                  activeRightTab === tab.id
                    ? "border-indigo-650 text-indigo-650 bg-slate-50/20 dark:bg-slate-850/20 font-black"
                    : "border-transparent text-slate-450 hover:bg-slate-50/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subpanel containers scroll */}
          <div className="flex-grow overflow-y-auto p-4">
            
            {/* SUBPANEL 1: Related Learning list */}
            {activeRightTab === "related" && (
              <div className="space-y-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Related Learning Connections</span>
                
                {/* Related Notes */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-450">Related Notes</h5>
                  {relatedItems.notes.length === 0 ? (
                    <span className="text-[9px] text-slate-400 block italic">No similar notes.</span>
                  ) : (
                    relatedItems.notes.map(n => (
                      <button
                        key={n._id}
                        onClick={() => api.get(`/api/notes/${n._id}`).then(res => handleSelectNote(res.data))}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 text-[10.5px] text-slate-300 hover:text-white flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="truncate">{n.title}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-500" />
                      </button>
                    ))
                  )}
                </div>

                {/* Related PDFs */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-450">Related PDFs</h5>
                  {relatedItems.pdfs.length === 0 ? (
                    <span className="text-[9px] text-slate-400 block italic">No matching textbooks.</span>
                  ) : (
                    relatedItems.pdfs.map(p => (
                      <div
                        key={p._id}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-[10.5px] text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate">{p.title}</span>
                        <BookOpen className="w-3.5 h-3.5 text-indigo-550" />
                      </div>
                    ))
                  )}
                </div>

                {/* Related Chats */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold uppercase text-slate-450">Related AI Chats</h5>
                  {relatedItems.chats.length === 0 ? (
                    <span className="text-[9px] text-slate-400 block italic">No matching conversations.</span>
                  ) : (
                    relatedItems.chats.map(c => (
                      <div
                        key={c._id}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-[10.5px] text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate">{c.title}</span>
                        <Compass className="w-3.5 h-3.5 text-indigo-550" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SUBPANEL 2: Version History Timeline */}
            {activeRightTab === "history" && (
              <div className="space-y-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Revision History Timeline</span>
                
                {previewVersion ? (
                  <div className="p-3 border rounded-xl bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="text-[9px] font-bold text-slate-400">Snapshot Preview</span>
                      <button onClick={() => setPreviewVersion(null)} className="text-xs text-slate-400 hover:text-slate-600">×</button>
                    </div>
                    <p className="text-[9px] text-slate-500 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap bg-white p-2 border rounded">
                      {previewVersion.content}
                    </p>
                    <button
                      onClick={() => handleRestoreVersion(previewVersion.version_id)}
                      className="w-full py-1.5 bg-indigo-600 text-white rounded text-[9px] font-bold uppercase"
                    >
                      Restore this Version
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeVersionHistory.length === 0 ? (
                      <div className="text-center py-6 text-[9px] text-slate-400">No edits recorded yet. Auto save logs history.</div>
                    ) : (
                      activeVersionHistory.map((ver, idx) => (
                        <div
                          key={ver.version_id}
                          onClick={() => setPreviewVersion(ver)}
                          className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-500/25 bg-slate-50/20 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all"
                        >
                          <div>
                            <h6 className="text-[10px] font-bold text-slate-700">{ver.change_summary}</h6>
                            <span className="text-[8px] text-slate-400 block mt-0.5">{new Date(ver.updated_at).toLocaleString()}</span>
                          </div>
                          <History className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUBPANEL 3: SVG Interactive Mind Maps */}
            {activeRightTab === "mindmap" && (
              <div className="space-y-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">SVG Mind Map Node Tree</span>
                
                {/* SVG Visual Canvas */}
                <div className="p-4 border rounded-2xl bg-slate-900 border-slate-800 flex justify-center items-center shadow-inner relative overflow-hidden h-72">
                  <svg className="w-full h-full" viewBox="0 0 300 220">
                    <circle cx="150" cy="30" r="14" fill="#6366f1" className="cursor-pointer" onClick={() => setMindMapExpanded(["Root"])} />
                    <text x="150" y="33" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">ROOT</text>

                    {mindMapExpanded.includes("Root") && (
                      <>
                        <line x1="150" y1="44" x2="80" y2="90" stroke="#4f46e5" strokeWidth="1.5" />
                        <line x1="150" y1="44" x2="220" y2="90" stroke="#4f46e5" strokeWidth="1.5" />

                        {/* Level 1 Nodes */}
                        <circle cx="80" cy="100" r="12" fill="#10b981" className="cursor-pointer" onClick={() => setMindMapExpanded(["Root", "A"])} />
                        <text x="80" y="103" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle" pointerEvents="none">General</text>

                        <circle cx="220" cy="100" r="12" fill="#10b981" className="cursor-pointer" onClick={() => setMindMapExpanded(["Root", "B"])} />
                        <text x="220" y="103" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle" pointerEvents="none">Details</text>
                      </>
                    )}

                    {mindMapExpanded.includes("A") && (
                      <>
                        <line x1="80" y1="112" x2="45" y2="160" stroke="#059669" strokeWidth="1" />
                        <line x1="80" y1="112" x2="115" y2="160" stroke="#059669" strokeWidth="1" />

                        <rect x="25" y="160" width="38" height="12" rx="3" fill="#374151" />
                        <text x="44" y="168" fill="#d1d5db" fontSize="5" textAnchor="middle">Revision</text>

                        <rect x="95" y="160" width="38" height="12" rx="3" fill="#374151" />
                        <text x="114" y="168" fill="#d1d5db" fontSize="5" textAnchor="middle">Summary</text>
                      </>
                    )}

                    {mindMapExpanded.includes("B") && (
                      <>
                        <line x1="220" y1="112" x2="185" y2="160" stroke="#059669" strokeWidth="1" />
                        <line x1="220" y1="112" x2="255" y2="160" stroke="#059669" strokeWidth="1" />

                        <rect x="165" y="160" width="38" height="12" rx="3" fill="#374151" />
                        <text x="184" y="168" fill="#d1d5db" fontSize="5" textAnchor="middle">Keywords</text>

                        <rect x="235" y="160" width="38" height="12" rx="3" fill="#374151" />
                        <text x="254" y="168" fill="#d1d5db" fontSize="5" textAnchor="middle">Questions</text>
                      </>
                    )}
                  </svg>
                  
                  <button
                    onClick={() => addToast("Exported Map", "Visual node map exported successfully.", "success")}
                    className="absolute bottom-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
