import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  MessageSquare,
  CheckSquare,
  BookOpen,
  Loader2,
  HelpCircle,
  FileCode,
  FolderLock,
  Compass,
  UserCheck,
  Zap,
  History,
  ArrowRight
} from "lucide-react";
import api from "../services/api";

interface SearchResult {
  notes: Array<{ id: string; title: string; category: string; type: "note" }>;
  pdfs: Array<{ id: string; filename: string; type: "pdf" }>;
  chats: Array<{ id: string; title: string; type: "chat" }>;
  tasks: Array<{ id: string; title: string; category: string; is_completed: boolean; type: "task" }>;
  flashcards: Array<{ id: string; title: string; type: "flashcards" }>;
  quizzes: Array<{ id: string; title: string; type: "quiz" }>;
  challenges: Array<{ id: string; title: string; category: string; type: "challenge" }>;
  roadmaps: Array<{ id: string; title: string; type: "roadmap" }>;
  interviews: Array<{ id: string; title: string; type: "interview" }>;
  recent_searches: string[];
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Catch Ctrl+K or Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch search results on query change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const url = query.trim() ? `/api/search?q=${encodeURIComponent(query)}` : "/api/search";
        const res = await api.get(url);
        setResults(res.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults(null);
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // Compile flat items list for keyboard navigation index calculation
  const getFlatItems = () => {
    const items: Array<{ label: string; action: () => void; category: string }> = [];
    
    // 1. Quick Actions (When query is empty)
    if (!query.trim()) {
      const actions = [
        { label: "Create Note", path: "/notes", category: "Action" },
        { label: "Upload PDF", path: "/pdf", category: "Action" },
        { label: "Start AI Tutor", path: "/ai", category: "Action" },
        { label: "Open Coding Playground", path: "/coding", category: "Action" },
        { label: "Start Mock Interview", path: "/resume", category: "Action" },
        { label: "Generate Flashcards", path: "/flashcards", category: "Action" },
        { label: "Generate Quiz", path: "/quiz", category: "Action" },
        { label: "Open Cybersecurity Lab", path: "/cybersecurity", category: "Action" },
        { label: "Open Career Hub Dashboard", path: "/resume", category: "Action" }
      ];
      actions.forEach(act => {
        items.push({ label: act.label, action: () => handleNavigate(act.path), category: act.category });
      });

      // Add recent searches if any
      if (results?.recent_searches) {
        results.recent_searches.forEach(q => {
          items.push({ label: q, action: () => setQuery(q), category: "History" });
        });
      }
      return items;
    }

    if (!results) return items;

    // Append search results categories
    if (results.notes) {
      results.notes.forEach(n => items.push({ label: n.title, action: () => handleNavigate(`/notes`), category: "Notes" }));
    }
    if (results.pdfs) {
      results.pdfs.forEach(p => items.push({ label: p.filename, action: () => handleNavigate(`/pdf`), category: "PDFs" }));
    }
    if (results.chats) {
      results.chats.forEach(c => items.push({ label: c.title, action: () => handleNavigate(`/ai`), category: "AI Chats" }));
    }
    if (results.tasks) {
      results.tasks.forEach(t => items.push({ label: t.title, action: () => handleNavigate("/planner"), category: "Study Plans" }));
    }
    if (results.flashcards) {
      results.flashcards.forEach(f => items.push({ label: f.title, action: () => handleNavigate("/flashcards"), category: "Flashcards" }));
    }
    if (results.quizzes) {
      results.quizzes.forEach(q => items.push({ label: q.title, action: () => handleNavigate("/quiz"), category: "Quizzes" }));
    }
    if (results.challenges) {
      results.challenges.forEach(ch => items.push({ label: ch.title, action: () => handleNavigate("/coding"), category: "Coding Challenges" }));
    }
    if (results.roadmaps) {
      results.roadmaps.forEach(r => items.push({ label: r.title, action: () => handleNavigate("/resume"), category: "Career Roadmaps" }));
    }
    if (results.interviews) {
      results.interviews.forEach(i => items.push({ label: i.title, action: () => handleNavigate("/resume"), category: "Interviews" }));
    }

    return items;
  };

  const flatItems = getFlatItems();

  const handleArrowKeys = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Command dialog */}
      <div 
        onKeyDown={handleArrowKeys}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-[#12131A] shadow-2xl transition-all duration-300 flex flex-col z-50"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0B0B12]">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0 animate-pulse-slow" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes, PDFs, AI chats, flashcards, mock interviews... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-xs"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
        </div>

        {/* Scrollable list */}
        <div className="max-h-[50vh] overflow-y-auto p-4 flex flex-col gap-4 bg-[#12131A]">
          
          {/* Quick Actions (Query empty) */}
          {!query.trim() && (
            <div className="space-y-4">
              <div>
                <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-indigo-500" /> Quick Action Shortcuts</h5>
                <div className="grid grid-cols-2 gap-2">
                  {flatItems.filter(i => i.category === "Action").map((act, idx) => {
                    const isSel = idx === selectedIndex;
                    return (
                      <button
                        key={idx}
                        onClick={act.action}
                        className={`p-2.5 rounded-xl border text-left text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                          isSel ? "border-indigo-500 bg-indigo-500/10 font-extrabold text-white" : "border-white/5 bg-[#181922] hover:bg-slate-800/10 text-slate-300"
                        }`}
                      >
                        {act.label}
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {results?.recent_searches && results.recent_searches.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Recent Searches</h5>
                  <div className="flex flex-col gap-1">
                    {results.recent_searches.map((q, idx) => {
                      const listIdx = flatItems.findIndex(i => i.category === "History" && i.label === q);
                      const isSel = listIdx === selectedIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => setQuery(q)}
                          className={`px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSel ? "bg-indigo-500/10 text-white font-bold" : "hover:bg-slate-800/10 text-slate-400"
                          }`}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grouped results view (Query active) */}
          {query.trim() && !loading && flatItems.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No matching records found for "{query}"
            </div>
          )}

          {query.trim() && !loading && flatItems.length > 0 && (
            <div className="space-y-4">
              {/* Group items by category to render headings */}
              {Array.from(new Set(flatItems.map(i => i.category))).map(cat => (
                <div key={cat}>
                  <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">{cat}</h5>
                  <div className="flex flex-col gap-1">
                    {flatItems.filter(i => i.category === cat).map((item, idx) => {
                      const itemIdx = flatItems.findIndex(fi => fi.label === item.label && fi.category === cat);
                      const isSel = itemIdx === selectedIndex;
                      return (
                        <button
                          key={idx}
                          onClick={item.action}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSel ? "bg-indigo-600 text-white font-extrabold" : "hover:bg-[#181922] text-slate-300"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${isSel ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-[#0B0B12] text-[10px] text-slate-400 select-none">
          <span>Search and navigate the StudySphere platform</span>
          <span className="flex gap-3">
            <span>↑↓ to navigate</span>
            <span>Enter to select</span>
            <span>Esc to exit</span>
          </span>
        </div>
      </div>
    </div>
  );
};
