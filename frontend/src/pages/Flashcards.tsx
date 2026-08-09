import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  FolderLock,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Shuffle,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Card {
  front: string;
  back: string;
  is_bookmarked: boolean;
  status: "new" | "learning" | "mastered";
}

interface Deck {
  _id: string;
  category: string;
  cards: Card[];
  created_at: string;
}

export const Flashcards: React.FC = () => {
  const { addToast } = useNotifications();
  
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  
  // Cards manipulation
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Swipe & touch vectors
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Deck generation inputs
  const [category, setCategory] = useState("Operating Systems");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Keyboard navigation shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDeckId && cards.length > 0) {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
          return;
        }
        
        if (e.code === "Space") {
          e.preventDefault();
          setIsFlipped(f => !f);
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          if (currentCardIdx < cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIdx(prev => prev + 1), 100);
          }
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          if (currentCardIdx > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIdx(prev => prev - 1), 100);
          }
        } else if (isFlipped && e.key.toLowerCase() === "l") {
          e.preventDefault();
          handleSetCardStatus("learning");
        } else if (isFlipped && e.key.toLowerCase() === "m") {
          e.preventDefault();
          handleSetCardStatus("mastered");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeckId, cards, currentCardIdx, isFlipped]);

  const loadDecks = async (selectId?: string) => {
    try {
      const res = await api.get("/api/flashcards/decks");
      setDecks(res.data);
      if (res.data.length > 0) {
        const targetId = selectId || res.data[0]._id;
        const active = res.data.find((d: Deck) => d._id === targetId) || res.data[0];
        setActiveDeckId(active._id);
        setCards(active.cards || []);
        setCurrentCardIdx(0);
        setIsFlipped(false);
      } else {
        setActiveDeckId(null);
        setCards([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleGenerateDeck = async () => {
    if (!category.trim()) return;
    setLoading(true);
    addToast("Generating Flashcards", "AI compiling recall term sets...", "info");
    try {
      const res = await api.post("/api/flashcards/generate", {
        category,
        text_input: textInput
      });
      addToast("Cards Scaffolded", `Category: ${category}`, "success");
      setTextInput("");
      loadDecks(res.data._id);
    } catch (e) {
      addToast("Failed", "AI flashcards compilation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/flashcards/decks/${deckId}`);
      addToast("Deleted", "Flashcard deck removed.", "success");
      loadDecks();
    } catch (err) {
      addToast("Error", "Could not delete deck.", "error");
    }
  };

  const handleToggleBookmark = async () => {
    if (!activeDeckId || cards.length === 0) return;
    try {
      await api.post(`/api/flashcards/decks/${activeDeckId}/cards/${currentCardIdx}/bookmark`);
      const updatedCards = [...cards];
      updatedCards[currentCardIdx].is_bookmarked = !updatedCards[currentCardIdx].is_bookmarked;
      setCards(updatedCards);
      addToast("Bookmark Toggled", "Recall card bookmark updated.", "success");
    } catch (e) {
      addToast("Error", "Could not toggle bookmark.", "error");
    }
  };

  const handleSetCardStatus = async (status: "learning" | "mastered") => {
    if (!activeDeckId || cards.length === 0) return;
    try {
      await api.post(`/api/flashcards/decks/${activeDeckId}/cards/${currentCardIdx}/status`, { status });
      const updatedCards = [...cards];
      updatedCards[currentCardIdx].status = status;
      setCards(updatedCards);
      addToast("Recall Updated", `Card marked as ${status}.`, "success");
      
      // Auto advance to next card after status save
      if (currentCardIdx < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 200);
      }
    } catch (e) {
      addToast("Error", "Could not update learning status.", "error");
    }
  };

  const handleShuffleCards = () => {
    if (cards.length === 0) return;
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    addToast("Shuffled", "Cards deck randomized.", "success");
  };

  const handleSelectDeck = (deck: Deck) => {
    setActiveDeckId(deck._id);
    setCards(deck.cards || []);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (diffX < -50) {
      if (currentCardIdx < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 100);
      }
    } else if (diffX > 50) {
      if (currentCardIdx > 0) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIdx((prev) => prev - 1), 100);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (touchStartX === null) return;
    const diffX = e.clientX - touchStartX;
    setTouchStartX(null);
    if (diffX < -50) {
      if (currentCardIdx < cards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 100);
      }
    } else if (diffX > 50) {
      if (currentCardIdx > 0) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIdx((prev) => prev - 1), 100);
      }
    }
  };

  const masteredCount = cards.filter((c) => c.status === "mastered").length;
  const learningCount = cards.filter((c) => c.status === "learning").length;
  const newCount = cards.filter((c) => c.status === "new" || !c.status).length;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex border border-white/5 bg-[#12131A] rounded-3xl overflow-hidden shadow-xl w-full">
      
      {/* 1. LEFT SIDE PANEL: Deck generation & selection lists */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} flex-shrink-0 border-r border-white/5 flex flex-col bg-[#11121A] overflow-hidden transition-all`}>
        
        {/* AI Deck Wizard configuration */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-850 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generate AI Cards</h4>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Deck Category (e.g. OSI Model)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="premium-input w-full text-xs"
            />
            <textarea
              placeholder="Optional: Paste text context for generating definitions..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="premium-input w-full resize-none !h-20 text-[10px] py-2"
            />
            <button
              onClick={handleGenerateDeck}
              disabled={loading || !category.trim()}
              className="w-full premium-button-primary"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Scaffold Flashcards</span>
            </button>
          </div>
        </div>

        {/* Categories decks stack list */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1">
          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">Category Decks</h5>
          
          {decks.length === 0 ? (
            <div className="text-center py-12 text-[10px] text-slate-400">
              No decks configured.
            </div>
          ) : (
            decks.map((deck) => {
              const isActive = deck._id === activeDeckId;
              return (
                <div
                  key={deck._id}
                  onClick={() => handleSelectDeck(deck)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all relative group flex items-start gap-3 ${
                    isActive
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                      : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                  }`}
                >
                  <FolderLock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`} />
                  <div className="min-w-0 flex-grow">
                    <h4 className={`text-xs font-semibold truncate ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-450"}`}>
                      {deck.category}
                    </h4>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {deck.cards?.length || 0} cards
                    </span>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteDeck(deck._id, e)}
                    className="p-1 rounded bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 transition-all flex-shrink-0 self-center"
                    title="Remove Deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cards review viewport */}
      {activeDeckId && cards.length > 0 ? (
        <div className="flex-grow flex flex-col justify-between p-8 relative min-w-0">
          
          {/* Header info */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="space-y-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded bg-slate-55 dark:bg-slate-800/40 text-[10px] font-bold text-slate-500 lg:hidden mb-2"
              >
                Sidebar Toggle
              </button>
              <h3 className="text-sm font-bold">{decks.find(d => d._id === activeDeckId)?.category}</h3>
              <p className="text-[10px] text-slate-400">Review learning statuses</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleShuffleCards}
                className="p-2 border hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-500 transition-colors"
                title="Shuffle Cards"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Spaced repetition deck metrics card strip */}
          <div className="grid grid-cols-3 gap-2.5 select-none mt-1">
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">New Cards</span>
              <span className="text-xs font-black text-slate-300 block mt-0.5">{newCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#1e1a12]/40 border border-amber-500/10 text-center animate-pulse-slow">
              <span className="text-[9px] text-amber-550 font-bold uppercase tracking-wider block">Learning</span>
              <span className="text-xs font-black text-amber-500 block mt-0.5">{learningCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121d17]/40 border border-emerald-500/10 text-center">
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">Mastered</span>
              <span className="text-xs font-black text-emerald-400 block mt-0.5">{masteredCount}</span>
            </div>
          </div>

          {/* Flashcard 3D flip card card viewport with swipe gestures */}
          <div className="flex-grow flex items-center justify-center py-6 select-none">
            <div 
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full max-w-md h-72 cursor-pointer relative perspective-1000 group select-none"
            >
              <div 
                style={{ transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                className={`w-full h-full rounded-[20px] transform-style-3d relative ${isFlipped ? "rotate-y-180" : ""}`}
              >
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full rounded-[20px] border border-white/5 bg-[#181922] shadow-xl flex flex-col justify-between p-8 backface-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-slate-400">
                    <span>RECALL CARD {currentCardIdx + 1} OF {cards.length}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark();
                      }}
                      className={`p-1.5 rounded border transition-colors ${cards[currentCardIdx].is_bookmarked ? "text-indigo-500 border-indigo-505/20 bg-indigo-500/5" : "text-slate-400 border-slate-100"}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${cards[currentCardIdx].is_bookmarked ? "fill-indigo-500" : ""}`} />
                    </button>
                  </div>
                  
                  <div className="text-center py-4 px-2">
                    <p className="text-sm font-bold text-slate-200 leading-relaxed">
                      {cards[currentCardIdx].front}
                    </p>
                  </div>

                  <div className="text-center text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5" /> Swipe or Tap to Flip
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full rounded-[20px] border border-indigo-500/20 bg-[#121422] text-white shadow-xl flex flex-col justify-between p-8 backface-hidden rotate-y-180">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-indigo-300">
                    <span>ANSWER DETAILS</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wide ${
                      cards[currentCardIdx].status === "mastered"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : cards[currentCardIdx].status === "learning"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/10 text-white/70"
                    }`}>
                      {cards[currentCardIdx].status}
                    </span>
                  </div>

                  <div className="text-center py-4 px-2">
                    <p className="text-xs sm:text-sm leading-relaxed text-indigo-100 font-medium">
                      {cards[currentCardIdx].back}
                    </p>
                  </div>

                  <div className="text-center text-[10px] text-indigo-350 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Tap to Hide Answer
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Navigation and Spaced Repetition status inputs */}
          <div className="space-y-6">
            
            {/* Progress gauge */}
            <div className="space-y-1 select-none">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Mastery Progress</span>
                <span className="font-bold">{masteredCount} of {cards.length} Mastered</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${(masteredCount / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 select-none">
              <div className="flex gap-2">
                <button
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => setCurrentCardIdx((prev) => prev - 1), 100);
                  }}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-400 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  disabled={currentCardIdx === cards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 100);
                  }}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-655 dark:text-slate-400 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Repetition score */}
              {isFlipped && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSetCardStatus("learning")}
                    className="flex-grow sm:flex-grow-0 px-4 py-2 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Still Learning
                  </button>
                  <button
                    onClick={() => handleSetCardStatus("mastered")}
                    className="flex-grow sm:flex-grow-0 px-4 py-2 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-550 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Mastered
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-6 bg-[#12131A] dark:bg-slate-950/20 select-none">
          <div className="text-center space-y-5 max-w-md mx-auto w-full p-10 border border-white/5 bg-[#161720]/40 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mx-auto shadow-inner animate-bounce">
              <FolderOpen className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Select a Study Deck</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Choose a recall card deck from the sidebar library to begin active recall practice, or use the generator above to compile a new deck.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
