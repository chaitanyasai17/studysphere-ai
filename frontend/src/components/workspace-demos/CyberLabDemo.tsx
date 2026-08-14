import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Shield, CheckCircle, Lock, Server, Cpu, Activity, AlertTriangle } from "lucide-react";

export const CyberLabDemo: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showInsight, setShowInsight] = useState(false);
  const [packetPos, setPacketPos] = useState(0); // 0 = Client, 1 = Firewall, 2 = Server

  const scriptSteps = [
    { text: "[00:01] Initializing learning environment...", pct: 15, pos: 0 },
    { text: "[00:02] Loading network simulation...", pct: 30, pos: 0 },
    { text: "[00:03] Analyzing packets...", pct: 50, pos: 1 },
    { text: "[00:04] Checking traffic patterns...", pct: 70, pos: 1 },
    { text: "[00:05] Anomaly detected: Unexpected Port Scan Pattern", pct: 85, pos: 2, isAnomaly: true },
    { text: "[00:06] Generating security report...", pct: 95, pos: 2 },
    { text: "[00:07] Simulation complete ✓", pct: 100, pos: 2, isDone: true }
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

  useEffect(() => {
    clearAllTimeouts();

    setStepIndex(0);
    setProgress(0);
    setLogs([]);
    setShowInsight(false);
    setPacketPos(0);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < scriptSteps.length) {
        const step = scriptSteps[idx];
        setStepIndex(idx);
        setProgress(step.pct);
        setPacketPos(step.pos);
        setLogs((prev) => [...prev, step.text]);

        if (step.isDone) {
          clearInterval(interval);
          addTimeout(() => setShowInsight(true), 500);

          // Hold then loop
          addTimeout(() => {
            addTimeout(() => {
              clearAllTimeouts();
              setStepIndex(0);
              setProgress(0);
              setLogs([]);
              setShowInsight(false);
              setPacketPos(0);
            }, 3800);
          }, 2000);
        }
        idx++;
      }
    }, 900);

    timeoutsRef.current.push(interval as any);

    return () => clearAllTimeouts();
  }, []);

  return (
    <div className="space-y-3 flex flex-col justify-between h-full font-mono text-left">
      <div className="space-y-3">
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-[#08090F] px-3 py-2 rounded-xl border border-slate-855 text-[10px]">
          <span className="text-rose-400 font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> student@studysphere-sec-lab:~#
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
            Network Packet Simulator
          </span>
        </div>

        {/* Network Packet Motion Visualizer */}
        <div className="p-3 rounded-xl bg-[#06070B] border border-slate-855 flex items-center justify-around relative overflow-hidden">
          {/* Connecting line */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800" />
          
          {/* Animated Packet Pulse Dot */}
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] z-10"
            animate={{
              left: packetPos === 0 ? "15%" : packetPos === 1 ? "50%" : "85%"
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />

          {/* Node 1: Client */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${packetPos === 0 ? "bg-rose-500/20 border-rose-500/50 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[9px] text-slate-400">Client</span>
          </div>

          {/* Node 2: Firewall / Router */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${packetPos === 1 ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[9px] text-slate-400">Firewall</span>
          </div>

          {/* Node 3: Server */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${packetPos === 2 ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
              <Server className="w-4 h-4" />
            </div>
            <span className="text-[9px] text-slate-400">Server</span>
          </div>
        </div>

        {/* Progress Bar Visualizer */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Simulation Analysis Progress</span>
            <span className="text-rose-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-855">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Terminal Log Console */}
        <div className="p-3 rounded-xl bg-[#040508] border border-slate-855 text-[10px] space-y-1 min-h-[90px] overflow-hidden">
          {logs.map((log, idx) => (
            <motion.p
              key={idx}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={
                log.includes("Anomaly")
                  ? "text-amber-400 font-bold flex items-center gap-1"
                  : log.includes("complete")
                  ? "text-emerald-400 font-bold"
                  : "text-slate-300"
              }
            >
              {log.includes("Anomaly") && <AlertTriangle className="w-3 h-3 text-amber-400" />}
              <span>{log}</span>
            </motion.p>
          ))}
        </div>

        {/* Educational Insight Card */}
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-sans space-y-1"
          >
            <span className="font-bold text-[10.5px] text-purple-200 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Learning Insight
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              "Unusual traffic patterns can indicate potential security anomalies."
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="pt-2 border-t border-slate-855 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="text-emerald-400 font-bold flex items-center gap-1 font-sans">
          <CheckCircle className="w-3.5 h-3.5" /> Cyber Simulation Environment Operational
        </span>
        <span>Harmless Educational Demo</span>
      </div>
    </div>
  );
};
