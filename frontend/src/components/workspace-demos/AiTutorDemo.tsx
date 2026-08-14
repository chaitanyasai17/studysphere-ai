import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, CheckCircle, Loader2, User } from "lucide-react";

export const AiTutorDemo: React.FC = () => {
  const [typedPrompt, setTypedPrompt] = useState("");
  const [stage, setStage] = useState<
    "typing_user" | "sending" | "submitted" | "thinking" | "answering" | "code" | "badge" | "hold"
  >("typing_user");

  const [responseLine1, setResponseLine1] = useState("");
  const [responseLine2, setResponseLine2] = useState("");
  const [codeLineIndex, setCodeLineIndex] = useState(0);

  const fullQuestion = "Explain how caching improves Big-O performance";
  const fullAns1 = "Caching stores previously computed results so they can be reused.";
  const fullAns2 =
    "Instead of repeatedly searching through data with O(n) work, a hash-based cache can retrieve stored results in O(1) average time.";

  const codeSnippet = [
    "cache = {}",
    "def get_item(item_id):",
    "    return cache.get(item_id)"
  ];

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

  // Main Demo Sequence State Machine
  useEffect(() => {
    clearAllTimeouts();

    // Reset internal states
    setTypedPrompt("");
    setStage("typing_user");
    setResponseLine1("");
    setResponseLine2("");
    setCodeLineIndex(0);

    // 1. Character-by-character typing of user prompt
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx < fullQuestion.length) {
        setTypedPrompt(fullQuestion.slice(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        
        // 2. Pause then trigger Send
        addTimeout(() => setStage("sending"), 400);

        // 3. User message submitted to chat
        addTimeout(() => {
          setStage("submitted");
          setStage("thinking");
        }, 900);

        // 4. Start AI Response streaming (Line 1)
        addTimeout(() => {
          setStage("answering");
          let l1Idx = 0;
          const l1Interval = setInterval(() => {
            if (l1Idx < fullAns1.length) {
              setResponseLine1(fullAns1.slice(0, l1Idx + 1));
              l1Idx++;
            } else {
              clearInterval(l1Interval);

              // 5. Stream Line 2
              let l2Idx = 0;
              const l2Interval = setInterval(() => {
                if (l2Idx < fullAns2.length) {
                  setResponseLine2(fullAns2.slice(0, l2Idx + 1));
                  l2Idx++;
                } else {
                  clearInterval(l2Interval);

                  // 6. Reveal Code Block line by line
                  setStage("code");
                  addTimeout(() => setCodeLineIndex(1), 300);
                  addTimeout(() => setCodeLineIndex(2), 700);
                  addTimeout(() => setCodeLineIndex(3), 1100);

                  // 7. Reveal Insight Badge
                  addTimeout(() => setStage("badge"), 1600);

                  // 8. Hold then loop back
                  addTimeout(() => {
                    setStage("hold");
                    // Trigger state machine rerun by re-executing useEffect logic
                    addTimeout(() => {
                      clearAllTimeouts();
                      setTypedPrompt("");
                      setStage("typing_user");
                      setResponseLine1("");
                      setResponseLine2("");
                      setCodeLineIndex(0);
                    }, 4000);
                  }, 2000);
                }
              }, 20);
              timeoutsRef.current.push(l2Interval as any);
            }
          }, 25);
          timeoutsRef.current.push(l1Interval as any);
        }, 2200);
      }
    }, 45);

    timeoutsRef.current.push(typeInterval as any);

    return () => clearAllTimeouts();
  }, []);

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Top Chat Container */}
      <div className="space-y-4 flex-grow overflow-y-auto">
        {/* User Message Bubble */}
        {(stage === "submitted" || stage === "thinking" || stage === "answering" || stage === "code" || stage === "badge" || stage === "hold") && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex justify-end"
          >
            <div className="max-w-md px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium shadow-lg flex items-center gap-2">
              <span>{fullQuestion}</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">
                <User className="w-3 h-3 text-white" />
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Thinking Indicator */}
        {stage === "thinking" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs flex items-center gap-2.5"
          >
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span className="font-mono text-[11px] flex items-center gap-1">
              <span>AI is thinking</span>
              <span className="animate-pulse">...</span>
            </span>
          </motion.div>
        )}

        {/* AI Response Output Block */}
        {(stage === "answering" || stage === "code" || stage === "badge" || stage === "hold") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-xs font-bold text-slate-200">StudySphere AI Tutor</span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>{responseLine1}</p>
              {responseLine2 && <p>{responseLine2}</p>}
            </div>

            {/* Code Generation Block */}
            {codeLineIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3.5 rounded-xl bg-[#07080D] border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-hidden"
              >
                <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-855 pb-1.5 mb-2">
                  <span>cache_lookup.py</span>
                  <span className="text-emerald-400">O(1) Hash Map</span>
                </div>
                {codeLineIndex >= 1 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="text-purple-400">{codeSnippet[0]}</span>
                  </motion.p>
                )}
                {codeLineIndex >= 2 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="text-indigo-400">def</span> <span className="text-sky-300">get_item</span>(item_id):
                  </motion.p>
                )}
                {codeLineIndex >= 3 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-4">
                    <span className="text-indigo-400">return</span> cache.get(item_id)
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Insight Badge */}
            {(stage === "badge" || stage === "hold") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Time complexity improved</span>
                </span>
                <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">
                  O(n) → O(1) average lookup
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Interactive Input Simulation Bar */}
      <div className="pt-2 border-t border-slate-855">
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            value={stage === "typing_user" || stage === "sending" ? typedPrompt : ""}
            placeholder={stage === "typing_user" ? "" : "Ask AI Tutor a question..."}
            className="w-full h-11 pl-4 pr-12 rounded-xl bg-[#08090F] border border-slate-800 text-xs text-slate-200 outline-none placeholder:text-slate-600 font-sans"
          />
          {stage === "typing_user" && (
            <span className="absolute left-[calc(1rem+${typedPrompt.length*7}px)] text-purple-400 font-bold animate-pulse">
              |
            </span>
          )}
          <button
            className={`absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              stage === "sending"
                ? "bg-purple-500 text-white scale-90 shadow-lg shadow-purple-500/50"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
