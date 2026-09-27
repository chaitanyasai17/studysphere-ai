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
import { motion } from "framer-motion";

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
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [category, setCategory] = useState("Operating Systems");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 sm:p-8 h-[calc(100vh-6rem)]"
    >
      <div className="flex h-full bg-[#0f0f1a] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-80" : "w-0"} flex-shrink-0 border-r border-white/[0.06] bg-[#161625] flex flex-col transition-all overflow-hidden`}>
          <div className="p-6 border-b border-white/[0.06] space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Generate AI Cards
            </h4>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Deck Category (e.g. OSI Model)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none"
              />
              <textarea
                placeholder="Optional context..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none resize-none h-24"
              />
              <button
                onClick={handleGenerateDeck}
                disabled={loading || !category.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate Deck
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            <h5 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-3">Your Decks</h5>
            
            {decks.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No decks configured.
              </div>
            ) : (
              decks.map((deck) => {
                const isActive = deck._id === activeDeckId;
                return (
                  <div
                    key={deck._id}
                    onClick={() => handleSelectDeck(deck)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all relative group flex items-center gap-3 ${
                      isActive
                        ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        : "bg-[#0a0a12] border-white/[0.06] hover:border-purple-500/30"
                    }`}
                  >
                    <FolderLock className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
                    <div className="min-w-0 flex-grow">
                      <h4 className={`text-sm font-semibold truncate ${isActive ? "text-purple-100" : "text-slate-300"}`}>
                        {deck.category}
                      </h4>
                      <span className="text-xs text-slate-500 block">
                        {deck.cards?.length || 0} cards
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteDeck(deck._id, e)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Area */}
        {activeDeckId && cards.length > 0 ? (
          <div className="flex-grow flex flex-col p-6 sm:p-8 min-w-0 bg-[#0a0a12]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-colors"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white">{decks.find(d => d._id === activeDeckId)?.category}</h3>
                  <p className="text-sm text-slate-400">Review learning statuses</p>
                </div>
              </div>
              
              <button
                onClick={handleShuffleCards}
                className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
                title="Shuffle Cards"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#161625] border border-white/[0.06] p-4 rounded-xl text-center">
                <span className="text-xs text-slate-400 font-semibold uppercase">New Cards</span>
                <span className="text-lg font-bold text-white block mt-1">{newCount}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center">
                <span className="text-xs text-amber-500 font-semibold uppercase">Learning</span>
                <span className="text-lg font-bold text-amber-400 block mt-1">{learningCount}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                <span className="text-xs text-emerald-500 font-semibold uppercase">Mastered</span>
                <span className="text-lg font-bold text-emerald-400 block mt-1">{masteredCount}</span>
              </div>
            </div>

            <div className="flex-grow flex items-center justify-center py-4 perspective-1000">
              <div 
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-xl h-80 cursor-pointer relative group"
              >
                <div 
                  style={{ transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  className={`w-full h-full rounded-2xl transform-style-3d relative ${isFlipped ? "rotate-y-180" : ""}`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl border border-white/[0.06] bg-[#161625] shadow-xl flex flex-col justify-between p-8 backface-hidden">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                      <span>CARD {currentCardIdx + 1} OF {cards.length}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark();
                        }}
                        className={`p-2 rounded-lg transition-colors ${cards[currentCardIdx].is_bookmarked ? "text-purple-400 bg-purple-500/10" : "text-slate-400 hover:bg-white/[0.05]"}`}
                      >
                        <Bookmark className={`w-4 h-4 ${cards[currentCardIdx].is_bookmarked ? "fill-purple-400" : ""}`} />
                      </button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xl font-medium text-white leading-relaxed">
                        {cards[currentCardIdx].front}
                      </p>
                    </div>

                    <div className="text-center text-xs text-purple-400 font-semibold flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Tap to Flip
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl border border-purple-500/20 bg-purple-500/10 text-white shadow-xl flex flex-col justify-between p-8 backface-hidden rotate-y-180">
                    <div className="flex justify-between items-center text-xs font-semibold text-purple-300">
                      <span>ANSWER</span>
                      <span className={`px-2 py-1 rounded-md uppercase text-[10px] tracking-wide ${
                        cards[currentCardIdx].status === "mastered"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : cards[currentCardIdx].status === "learning"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-white/10 text-white/70"
                      }`}>
                        {cards[currentCardIdx].status}
                      </span>
                    </div>

                    <div className="text-center overflow-y-auto max-h-[160px] scrollbar-thin">
                      <p className="text-lg leading-relaxed text-purple-50 font-medium">
                        {cards[currentCardIdx].back}
                      </p>
                    </div>

                    <div className="text-center text-xs text-purple-300 font-semibold flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Tap to Hide
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span>Mastery Progress</span>
                  <span className="font-semibold">{masteredCount} of {cards.length} Mastered</span>
                </div>
                <div className="w-full bg-[#161625] h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-purple-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${(masteredCount / cards.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-3">
                  <button
                    disabled={currentCardIdx === 0}
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => setCurrentCardIdx((prev) => prev - 1), 100);
                    }}
                    className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={currentCardIdx === cards.length - 1}
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => setCurrentCardIdx((prev) => prev + 1), 100);
                    }}
                    className="px-4 py-2 bg-white/[0.05] border border-white/[0.08] text-white rounded-xl hover:bg-white/[0.08] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {isFlipped && (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleSetCardStatus("learning")}
                      className="flex-grow sm:flex-grow-0 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 rounded-xl text-sm font-semibold transition-all"
                    >
                      Learning (L)
                    </button>
                    <button
                      onClick={() => handleSetCardStatus("mastered")}
                      className="flex-grow sm:flex-grow-0 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Mastered (M)
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#0a0a12]">
            <div className="text-center space-y-6 max-w-md w-full p-8 border border-white/[0.06] bg-[#161625] rounded-3xl hover:border-purple-500/30 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mx-auto">
                <FolderOpen className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Select a Study Deck</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Choose a recall card deck from the sidebar library to begin active recall practice, or use the generator to compile a new deck.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
