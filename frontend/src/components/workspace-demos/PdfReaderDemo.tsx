import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, CheckCircle, Tag, Layers } from "lucide-react";

export const PdfReaderDemo: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [highlight1, setHighlight1] = useState(false);
  const [highlight2, setHighlight2] = useState(false);
  const [aiText, setAiText] = useState("");
  const [showInsight, setShowInsight] = useState(false);
  const [showConceptBadge, setShowConceptBadge] = useState(false);

  const fullAiText = "This paragraph explains the relationship between time and space complexity.";

  const timeoutsRef = useRef<any[]>([]);

  const addTimeout = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timeoutsRef.current.push(t);
    return t;
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    clearAllTimeouts();

    setScrollY(0);
    setHighlight1(false);
    setHighlight2(false);
    setAiText("");
    setShowInsight(false);
    setShowConceptBadge(false);

    // 1. Simulate Scrolling after 600ms
    addTimeout(() => setScrollY(-25), 600);

    // 2. Highlight Sentence 1 after 1400ms
    addTimeout(() => setHighlight1(true), 1400);

    // 3. Show AI Insight panel after 2200ms
    addTimeout(() => {
      setShowInsight(true);
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (idx < fullAiText.length) {
          setAiText(fullAiText.slice(0, idx + 1));
          idx++;
        } else {
          clearInterval(typeInterval);

          // 4. Highlight Phrase 2
          addTimeout(() => setHighlight2(true), 600);

          // 5. Show Concept Badge
          addTimeout(() => setShowConceptBadge(true), 1200);

          // 6. Hold then reset & loop
          addTimeout(() => {
            addTimeout(() => {
              clearAllTimeouts();
              setScrollY(0);
              setHighlight1(false);
              setHighlight2(false);
              setAiText("");
              setShowInsight(false);
              setShowConceptBadge(false);
            }, 3500);
          }, 1800);
        }
      }, 30);
      timeoutsRef.current.push(typeInterval as any);
    }, 2200);

    return () => clearAllTimeouts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full text-left">
      {/* Left Sidebar Chapter Tree */}
      <div className="hidden md:block md:col-span-4 p-3 rounded-xl bg-[#08090F] border border-slate-855 space-y-2 font-mono text-[10px]">
        <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-2 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-sky-400" /> data_structures.pdf
        </div>
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold flex items-center justify-between">
          <span>Ch 2: Hash Tables</span>
          <span className="text-[8px] bg-sky-400/20 text-sky-300 px-1.5 py-0.5 rounded">Pg 14</span>
        </div>
        <div className="p-2 text-slate-500 hover:text-slate-300 flex items-center justify-between">
          <span>Ch 3: Binary Trees</span>
          <span>Pg 42</span>
        </div>
        <div className="p-2 text-slate-500 hover:text-slate-300 flex items-center justify-between">
          <span>Ch 4: System Scaling</span>
          <span>Pg 88</span>
        </div>
      </div>

      {/* Main Document Body Panel */}
      <div className="col-span-12 md:col-span-8 flex flex-col justify-between space-y-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-855 pb-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>Chapter 2.4: Time &amp; Space Complexity</span>
            </h4>
            <span className="text-[9px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
              Page 14 of 240
            </span>
          </div>

          {/* Document Content View with Smooth Scroll Transform */}
          <div className="h-[140px] overflow-hidden relative p-3.5 rounded-xl bg-[#08090F] border border-slate-855 text-xs text-slate-300 leading-relaxed">
            <motion.div
              animate={{ y: scrollY }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="space-y-2"
            >
              <p className="text-slate-500 text-[11px]">
                Section 2.4.1 — Algorithmic Tradeoffs in Distributed Cache Memory
              </p>
              
              <p>
                <span
                  className={`transition-all duration-500 ${
                    highlight1
                      ? "bg-gradient-to-r from-sky-500/30 to-indigo-500/30 text-sky-200 px-1 rounded border-b border-sky-400/50 shadow-sm"
                      : ""
                  }`}
                >
                  Hash tables map key-value pairs to achieve constant time lookups.
                </span>{" "}
                When memory constraints permit, caching precomputed outputs dramatically improves system throughput.
              </p>

              <p>
                <span
                  className={`transition-all duration-500 ${
                    highlight2
                      ? "bg-amber-500/20 text-amber-200 px-1 rounded border-b border-amber-400/50"
                      : ""
                  }`}
                >
                  Key concept detected: Hash-based caching
                </span>{" "}
                eliminates redundant algorithmic iterations across high-density queries.
              </p>
            </motion.div>
          </div>

          {/* AI Insight Panel */}
          {showInsight && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="p-3 rounded-xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900/40 border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-sky-300">AI Insight</span>
                  {showConceptBadge && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" /> Concept: Hash Caching
                    </motion.span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug font-sans">
                  {aiText}
                  {aiText.length < fullAiText.length && (
                    <span className="text-sky-400 font-bold animate-pulse">|</span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Info Ribbon */}
        <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="text-sky-400 font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Live RAG Context Scanner Active
          </span>
          <span>Citation Match: 98%</span>
        </div>
      </div>
    </div>
  );
};
