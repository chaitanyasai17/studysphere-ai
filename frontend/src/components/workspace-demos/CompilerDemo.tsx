import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Code, Play, Loader2, CheckCircle, Cpu, Layers } from "lucide-react";

export const CompilerDemo: React.FC = () => {
  const [typedCode, setTypedCode] = useState("");
  const [stage, setStage] = useState<"typing" | "pause" | "running" | "output" | "complexity" | "hold">("typing");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const fullCode = `def find_user(users, target):
    for user in users:
        if user == target:
            return True
    return False`;

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

    setTypedCode("");
    setStage("typing");
    setTerminalLines([]);

    // 1. Character by character code typing
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx < fullCode.length) {
        setTypedCode(fullCode.slice(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);

        // 2. Pause before Triggering Run
        addTimeout(() => setStage("pause"), 500);

        // 3. Trigger Run Button Click
        addTimeout(() => {
          setStage("running");
        }, 1100);

        // 4. Output lines streaming
        addTimeout(() => {
          setStage("output");
          setTerminalLines(["> Executing program..."]);

          addTimeout(() => {
            setTerminalLines((prev) => [...prev, "> Search completed"]);
          }, 400);

          addTimeout(() => {
            setTerminalLines((prev) => [...prev, "> Result: Found"]);
          }, 800);

          addTimeout(() => {
            setTerminalLines((prev) => [...prev, "> Execution time: 12 ms"]);
          }, 1200);

          // 5. Show Complexity Analysis Badges
          addTimeout(() => {
            setStage("complexity");
          }, 1700);

          // 6. Hold then loop back
          addTimeout(() => {
            setStage("hold");
            addTimeout(() => {
              clearAllTimeouts();
              setTypedCode("");
              setStage("typing");
              setTerminalLines([]);
            }, 3800);
          }, 2400);
        }, 2200);
      }
    }, 32);

    timeoutsRef.current.push(typeInterval as any);

    return () => clearAllTimeouts();
  }, []);

  return (
    <div className="space-y-3 flex flex-col justify-between h-full text-left">
      <div className="space-y-3">
        {/* IDE Top Bar */}
        <div className="flex items-center justify-between bg-[#08090F] px-3 py-2 rounded-xl border border-slate-855 font-mono text-[10px]">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-emerald-400" /> find_user.py
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Python 3.12
            </span>
            <button
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                stage === "running"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 scale-95 shadow-lg shadow-amber-500/20"
                  : stage === "output" || stage === "complexity" || stage === "hold"
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
              }`}
            >
              {stage === "running" ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Editor Code View */}
        <div className="p-3.5 rounded-xl bg-[#06070B] border border-slate-855 font-mono text-[11px] text-slate-300 leading-relaxed min-h-[120px] overflow-hidden">
          <div className="flex gap-3 text-slate-600">
            <div className="select-none text-right flex flex-col space-y-0.5 text-slate-600">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
            <pre className="font-mono whitespace-pre text-slate-200 leading-tight">
              {typedCode}
              {stage === "typing" && (
                <span className="text-emerald-400 font-bold animate-pulse">|</span>
              )}
            </pre>
          </div>
        </div>

        {/* Output Terminal Panel */}
        <div className="p-3 rounded-xl bg-[#040508] border border-slate-855 font-mono text-[10px] space-y-1.5 min-h-[90px]">
          <div className="text-slate-500 flex justify-between">
            <span>Terminal Output</span>
            <span className="text-emerald-400 font-bold">Execution Engine</span>
          </div>

          {stage === "running" && (
            <div className="text-amber-400 animate-pulse flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Compiling &amp; executing find_user.py...
            </div>
          )}

          {(stage === "output" || stage === "complexity" || stage === "hold") && (
            <div className="space-y-1">
              {terminalLines.map((line, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={
                    line.includes("Result") || line.includes("completed")
                      ? "text-emerald-400 font-bold"
                      : "text-slate-300"
                  }
                >
                  {line}
                </motion.p>
              ))}
            </div>
          )}
        </div>

        {/* Complexity Analysis Badges */}
        {(stage === "complexity" || stage === "hold") && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2 text-[10px] font-mono"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between font-bold">
              <span>Time Complexity</span>
              <span className="bg-emerald-500/20 px-2 py-0.5 rounded">O(n)</span>
            </div>
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-between font-bold">
              <span>Space Complexity</span>
              <span className="bg-sky-500/20 px-2 py-0.5 rounded">O(1)</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Sandboxed Compiler Environment Ready
        </span>
        <span>Python 3.12 • C++20 • Java 21</span>
      </div>
    </div>
  );
};
