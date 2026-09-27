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
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(260);

  // Right-hand tabs (Related Learning, Version Timeline, Visual Mind Map)
  const [activeRightTab, setActiveRightTab] = useState<"related" | "history" | "ai">("related");

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
    setActiveRightTab("ai");
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
          <code key={codeIdx} className="px-1.5 py-0.5 rounded bg-white/[0.05] text-purple-400 font-mono text-sm border border-white/[0.06]">
            {codePart}
          </code>
        );
      }
      
      const boldParts = codePart.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((boldPart, boldIdx) => {
        if (boldIdx % 2 === 1) {
          return (
            <strong key={boldIdx} className="font-semibold text-white">
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
            <div key={`code-${idx}`} className="my-4 border border-white/[0.06] rounded-2xl overflow-hidden bg-[#0f0f1a] shadow-lg max-w-full text-left">
              <div className="flex items-center justify-between px-4 py-2 bg-[#161625] border-b border-white/[0.06] text-xs text-slate-400 font-mono select-none">
                <span>{codeBlockLang.toUpperCase()}</span>
                <button
                  onClick={() => handleCopyText(codeText)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-slate-400"
                >
                  <Eye className="w-4 h-4" /> Copy Code
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed bg-[#0a0a12]">
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
            <div key={`table-${idx}`} className="my-4 overflow-x-auto border border-white/[0.06] rounded-2xl bg-[#0f0f1a] shadow-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#161625] border-b border-white/[0.06] text-white">
                    {header.map((h, hIdx) => (
                      <th key={hIdx} className="p-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-400">
                  {body.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
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
        elements.push(<h1 key={idx} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/[0.06] pb-2">{line.replace("# ", "")}</h1>);
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-xl font-semibold text-white mt-6 mb-3 border-b border-white/[0.06] pb-1">{line.replace("## ", "")}</h2>);
        continue;
      }
      if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-lg font-medium text-white mt-4 mb-2">{line.replace("### ", "")}</h3>);
        continue;
      }
      
      // Quotes
      if (line.startsWith("> ")) {
        elements.push(<blockquote key={idx} className="border-l-4 border-purple-500 pl-4 py-2 italic my-4 bg-purple-500/10 text-sm text-slate-300 rounded-r-lg">{line.replace("> ", "")}</blockquote>);
        continue;
      }
      
      // Checklists
      if (line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("* [ ] ") || line.startsWith("* [x] ")) {
        const checked = line.includes("[x]");
        const textContent = line.substring(6);
        elements.push(
          <div key={idx} className="flex items-center gap-3 text-sm text-slate-400 my-2">
            <input 
              type="checkbox" 
              checked={checked} 
              readOnly 
              className="rounded border-white/[0.06] bg-[#0a0a12] text-purple-500 focus:ring-0 focus:ring-offset-0 w-4 h-4" 
            />
            <span className={checked ? "line-through text-slate-500" : "text-slate-300"}>{renderInlineTokens(textContent)}</span>
          </div>
        );
        continue;
      }
      
      // Bullet lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const clean = line.replace(/^[-*]\s+/, "");
        elements.push(<li key={idx} className="list-disc pl-2 text-sm text-slate-400 ml-4 my-1">{renderInlineTokens(clean)}</li>);
        continue;
      }
      
      // Ordered lists
      if (/^\d+\.\s+/.test(line)) {
        const clean = line.replace(/^\d+\.\s+/, "");
        const num = line.match(/^\d+/)?.[0] || "1";
        elements.push(
          <ol key={idx} className="list-decimal pl-2 text-sm text-slate-400 ml-4 my-1">
            <li value={parseInt(num)}>{renderInlineTokens(clean)}</li>
          </ol>
        );
        continue;
      }
      
      // Image markdown parser: ![alt](url)
      const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        elements.push(
          <div key={idx} className="my-6 flex flex-col items-center">
            <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-2xl border border-white/[0.06] shadow-xl max-w-full max-h-[400px] object-contain bg-[#0f0f1a] p-2" />
            {imgMatch[1] && <span className="text-xs text-slate-500 mt-2 select-none font-mono">{imgMatch[1]}</span>}
          </div>
        );
        continue;
      }

      // Default paragraph
      if (line.trim()) {
        elements.push(<p key={idx} className="text-sm text-slate-400 my-2 leading-relaxed">{renderInlineTokens(line)}</p>);
      } else {
        elements.push(<div key={idx} className="h-4" />);
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
    <div className="h-[calc(100vh-8.5rem)] flex border border-white/[0.06] bg-[#0a0a12] rounded-3xl overflow-hidden shadow-xl w-full relative max-w-[1400px] mx-auto">
      
      {!isStudyMode && (
        <div 
          style={{ width: viewMode === "split" ? "260px" : `${leftWidth}px` }}
          className="flex-shrink-0 border-r border-white/[0.04] flex flex-col bg-[#0c0c16] overflow-hidden select-none transition-all duration-300 md:block hidden md:w-[260px]"
        >
          <div className="p-4 border-b border-white/[0.06] flex gap-3 items-center flex-shrink-0">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0f0f1a] border border-white/[0.06] rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none text-sm"
              />
            </div>
            <button
              onClick={handleCreateNote}
              className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl w-10 h-10 flex items-center justify-center p-0 flex-shrink-0 cursor-pointer shadow-lg shadow-purple-500/20 transition-all duration-300"
              title="Create New Study Note"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-white/[0.06] px-2 py-1 gap-1 flex-shrink-0">
            {['All', 'Pinned', 'Favorites'].map(tab => (
              <button
                key={tab}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                onClick={() => setSelectedCategory(tab === 'All' ? 'All' : tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3 border-b border-white/[0.06] flex flex-wrap gap-2 flex-shrink-0 max-h-[150px] overflow-y-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-purple-500 border-purple-500 text-white"
                    : "bg-transparent border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-3 space-y-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No notes yet.<br/>Create your first note!</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note._id === activeNoteId;
                return (
                  <div
                    key={note._id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all relative group ${
                      isActive
                        ? "bg-purple-500/10 border-l-2 border-l-purple-500 border-y-transparent border-r-transparent shadow-[0_0_30px_rgba(139,92,246,0.1)]"
                        : "bg-[#161625] border-white/[0.06] hover:border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {note.is_pinned && <Pin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
                      {note.is_favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      <h4 className={`text-sm truncate font-semibold ${isActive ? "text-white" : "text-slate-200"}`}>
                        {note.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {note.content.replace(/[#*`\n]/g, " ").substring(0, 50) || "Empty note..."}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note._id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CENTER PANEL */}
      {activeNote ? (
        <div className={viewMode === "split" ? "w-[calc(100%-520px)] flex flex-col min-w-0 bg-[#0a0a12]" : "flex-grow flex flex-col min-w-0 bg-[#0a0a12]"}>
          
          {!isStudyMode && (
            <div className="px-6 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 bg-[#0a0a12] flex-shrink-0">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0f0f1a] border border-white/[0.06] focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-xs font-semibold text-white outline-none w-28"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0f0f1a] border border-white/[0.06] focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 text-xs font-semibold text-white outline-none w-32"
                />
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleToggleFlag(activeNote._id, "is_pinned", activeNote.is_pinned)}
                    className={`p-2 rounded-lg border transition-colors ${
                      activeNote.is_pinned ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-slate-400 border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleFlag(activeNote._id, "is_favorite", activeNote.is_favorite)}
                    className={`p-2 rounded-lg border transition-colors ${
                      activeNote.is_favorite ? "text-amber-400 fill-amber-400 border-amber-500/30 bg-amber-500/10" : "text-slate-400 border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {saving ? (
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" /> Saving...
                  </span>
                ) : (
                  <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}

                <div className="flex bg-[#0f0f1a] rounded-lg p-1 border border-white/[0.06]">
                  {["edit", "split", "preview"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer capitalize ${
                        viewMode === mode ? "bg-[#1a1a2e] text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportNote}
                  className="p-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors"
                  title="Export Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsStudyMode(true);
                    setFocusTimer(0);
                    setFocusTimerActive(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl text-xs font-semibold hover:bg-white/[0.08] transition-all"
                  title="Enter Distraction Free Study Mode"
                >
                  <Maximize2 className="w-4 h-4" /> Study Mode
                </button>
              </div>
            </div>
          )}

          {!isStudyMode && (
            <div className="px-6 py-3 border-b border-white/[0.06] flex items-center flex-wrap gap-2 flex-shrink-0 bg-[#0a0a12]">
              <Tag className="w-4 h-4 text-slate-500" />
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-[#161625] text-slate-300 border border-white/[0.06] flex items-center gap-1.5">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-400 focus:outline-none transition-colors">×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="+ Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                className="text-xs bg-transparent border-0 outline-none w-24 text-slate-400 placeholder:text-slate-600 focus:ring-0"
              />
            </div>
          )}

          <div 
            className="flex-grow flex divide-x divide-white/[0.06] overflow-hidden relative"
            style={viewMode === "split" ? { display: "grid", gridTemplateColumns: "1fr 1fr" } : undefined}
          >
            
            {/* Editor */}
            {(viewMode === "edit" || viewMode === "split") && !isStudyMode && (
              <div className="h-full p-6 flex flex-col gap-4 overflow-hidden relative">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-0 outline-none w-full text-white focus:ring-0 placeholder-slate-600"
                />
                <textarea
                  id="note-editor-textarea"
                  placeholder="Type Markdown structure here... (Use / for component shortcuts)"
                  value={content}
                  onChange={handleEditorChange}
                  onKeyDown={handleEditorKeyDown}
                  className="flex-grow w-full bg-transparent border-0 outline-none resize-none text-sm font-mono text-slate-300 focus:ring-0 leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                />

                {slashMenu?.show && (
                  <div className="absolute left-6 bottom-16 z-20 bg-[#161625] border border-white/[0.06] rounded-2xl p-2 w-72 shadow-2xl max-h-64 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 px-3 py-2 border-b border-white/[0.06] mb-1">
                      Basic Blocks
                    </div>
                    {[
                      { label: "Heading 1", description: "Large section heading", icon: "H1", insert: "# " },
                      { label: "Heading 2", description: "Medium section heading", icon: "H2", insert: "## " },
                      { label: "Checklist", description: "Track tasks with a todo list", icon: "✓", insert: "- [ ] " },
                      { label: "Bullet List", description: "Create a simple bulleted list", icon: "•", insert: "- " },
                      { label: "Code Block", description: "Insert formatted code", icon: "</>", insert: "```javascript\n\n```" },
                      { label: "Quote", description: "Capture a quote", icon: "\"", insert: "> " }
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
                          className="w-full text-left px-3 py-2.5 hover:bg-purple-500/10 rounded-xl transition-all flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#0f0f1a] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30">
                            {cmd.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200 group-hover:text-white">{cmd.label}</span>
                            <span className="text-xs text-slate-500">{cmd.description}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Previewer */}
            {(viewMode === "preview" || viewMode === "split") && !isStudyMode && (
              <div 
                className="h-full p-8 overflow-y-auto bg-[#0a0a12]"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
              >
                {viewMode === "preview" && (
                  <h1 className="text-3xl font-bold text-white border-b border-white/[0.06] pb-4 mb-6">
                    {title}
                  </h1>
                )}
                <div className="text-slate-300">
                  {parseMarkdownPreview(content)}
                </div>
              </div>
            )}

            {/* STUDY MODE */}
            {isStudyMode && (
              <div className="absolute inset-0 bg-[#0a0a12] z-30 flex flex-col">
                <div className="h-16 border-b border-white/[0.06] px-8 flex justify-between items-center bg-[#0c0c16]">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsStudyMode(false)}
                      className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-white truncate max-w-md">{title}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>{Math.floor(focusTimer / 60).toString().padStart(2, '0')}:{focusTimer % 60 < 10 ? '0' : ''}{focusTimer % 60}</span>
                    </div>
                    <button
                      onClick={() => setFocusTimerActive(!focusTimerActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        focusTimerActive ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-purple-600 text-white"
                      }`}
                    >
                      {focusTimerActive ? "Pause Focus" : "Resume Focus"}
                    </button>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto max-w-3xl mx-auto w-full py-16 px-8">
                  <h1 className="text-4xl font-bold text-white border-b border-white/[0.06] pb-6 mb-8">{title}</h1>
                  <div className="text-lg text-slate-300 leading-relaxed font-sans">
                    {parseMarkdownPreview(content)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-[#0a0a12]">
          <div className="w-20 h-20 bg-[#161625] rounded-2xl border border-white/[0.06] flex items-center justify-center mb-6 shadow-xl">
            <FileText className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your Workspace</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-8">
            Create a new note or select one from the sidebar to start writing in your distraction-free editor.
          </p>
          <button
            onClick={handleCreateNote}
            className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create New Note
          </button>
        </div>
      )}

      {/* RIGHT SIDEBAR */}
      {activeNote && !isStudyMode && viewMode !== "split" && (
        <div 
          style={{ width: `260px` }}
          className="flex-shrink-0 border-l border-white/[0.04] flex flex-col bg-[#0c0c16] overflow-hidden md:block hidden"
        >
          <div className="flex border-b border-white/[0.06] p-2 gap-1 flex-shrink-0 bg-[#0f0f1a]">
            {[
              { id: "related", icon: <Compass className="w-3.5 h-3.5" />, label: "Related" },
              { id: "history", icon: <History className="w-3.5 h-3.5" />, label: "History" },
              { id: "ai", icon: <Sparkles className="w-3.5 h-3.5" />, label: "AI Tools" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 rounded-lg transition-all text-[10px] font-semibold cursor-pointer ${
                  activeRightTab === tab.id
                    ? "bg-[#161625] text-purple-400 shadow-sm border border-white/[0.06]"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-5">
            
            {activeRightTab === "related" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" /> Related Notes
                  </h5>
                  {relatedItems.notes.length === 0 ? (
                    <p className="text-xs text-slate-500 bg-[#161625] p-3 rounded-xl border border-white/[0.06]">No similar notes found.</p>
                  ) : (
                    relatedItems.notes.map(n => (
                      <button
                        key={n._id}
                        onClick={() => api.get(`/api/notes/${n._id}`).then(res => handleSelectNote(res.data))}
                        className="w-full text-left p-3 rounded-xl bg-[#161625] border border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 text-xs text-slate-300 hover:text-white flex flex-col gap-1.5 transition-all"
                      >
                        <span className="font-medium truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-500 flex items-center justify-between">
                          {n.category} <ArrowRight className="w-3 h-3 text-purple-400" />
                        </span>
                      </button>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Source Materials
                  </h5>
                  {relatedItems.pdfs.length === 0 ? (
                    <p className="text-xs text-slate-500 bg-[#161625] p-3 rounded-xl border border-white/[0.06]">No linked documents.</p>
                  ) : (
                    relatedItems.pdfs.map(p => (
                      <div
                        key={p._id}
                        className="w-full text-left p-3 rounded-xl bg-[#161625] border border-white/[0.06] text-xs text-slate-300 flex items-center justify-between cursor-pointer hover:border-blue-500/30"
                      >
                        <span className="truncate">{p.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeRightTab === "history" && (
              <div className="space-y-4 relative">
                {previewVersion ? (
                  <div className="p-4 rounded-xl bg-[#161625] border border-purple-500/30 space-y-3 shadow-lg shadow-purple-500/5">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-semibold text-purple-400">Snapshot Preview</span>
                      <button onClick={() => setPreviewVersion(null)} className="text-slate-400 hover:text-white">×</button>
                    </div>
                    <div className="text-[10px] text-slate-400 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap bg-[#0a0a12] p-3 rounded-lg border border-white/[0.06]">
                      {previewVersion.content}
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(previewVersion.version_id)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Restore Version
                    </button>
                  </div>
                ) : (
                  <div className="relative border-l border-white/[0.1] ml-3 space-y-6 py-2">
                    {activeVersionHistory.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500 -ml-3">No history available yet.</div>
                    ) : (
                      activeVersionHistory.map((ver, idx) => (
                        <div
                          key={ver.version_id}
                          onClick={() => setPreviewVersion(ver)}
                          className="relative pl-5 cursor-pointer group"
                        >
                          <div className="absolute w-2.5 h-2.5 bg-[#0a0a12] border-2 border-purple-500 rounded-full -left-[5px] top-1 group-hover:bg-purple-500 transition-colors" />
                          <div className="p-3 rounded-xl bg-[#161625] border border-white/[0.06] group-hover:border-purple-500/30 transition-all">
                            <h6 className="text-xs font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">{ver.change_summary}</h6>
                            <span className="text-[10px] text-slate-500 block mt-1">{new Date(ver.updated_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeRightTab === "ai" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "summarize", label: "Summarize", icon: <BookOpen className="w-4 h-4 mb-1" /> },
                    { id: "expand", label: "Expand", icon: <Maximize2 className="w-4 h-4 mb-1" /> },
                    { id: "explain", label: "Explain", icon: <HelpCircle className="w-4 h-4 mb-1" /> },
                    { id: "quiz", label: "Quiz Me", icon: <CheckCircle2 className="w-4 h-4 mb-1" /> }
                  ].map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleAIAction(action.id)}
                      disabled={aiLoading}
                      className="p-3 bg-[#161625] border border-white/[0.06] hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl text-xs font-medium text-slate-300 hover:text-purple-400 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>

                {(aiLoading || aiOutput) && (
                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                    <h5 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-500" /> AI Assistant Output
                    </h5>
                    
                    {aiLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 bg-[#161625] rounded-xl border border-white/[0.06]">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        <span className="text-xs text-slate-400">Processing with AI...</span>
                      </div>
                    ) : (
                      <div className="bg-[#161625] rounded-xl border border-purple-500/30 p-4 shadow-lg shadow-purple-500/5 relative group">
                        <button 
                          onClick={() => handleCopyText(aiOutput || "")}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                          {aiOutput}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
