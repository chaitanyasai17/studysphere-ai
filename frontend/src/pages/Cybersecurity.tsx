import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Terminal,
  Activity,
  Key,
  Compass,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Play,
  Copy,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";

interface SocAlert {
  id: number;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  destination: string;
  signature: string;
  time: string;
  status: string;
}

interface TerminalLog {
  command: string;
  output: string;
  cwd: string;
}

export const Cybersecurity: React.FC = () => {
  const { addToast } = useNotifications();
  const [activeSection, setActiveSection] = useState<"networking" | "linux" | "crypto" | "websec" | "soc" | "tutor" | "roadmap">("networking");

  // Networking Lab State
  const [activeOsiLayer, setActiveOsiLayer] = useState(7);
  const [flowState, setFlowState] = useState<"idle" | "encapsulating" | "transmitting" | "decapsulating" | "delivered">("idle");
  const [flowLayer, setFlowLayer] = useState(7);

  const osiLayers = [
    { num: 7, name: "Application", protocols: "HTTP, DNS, SMTP, FTP", desc: "User interface and application interactions. Directly handles end-user inputs.", color: "from-purple-600 to-purple-400" },
    { num: 6, name: "Presentation", protocols: "SSL, TLS, JPEG, ASCII", desc: "Data translation, compression, and encryption/decryption validation.", color: "from-violet-600 to-purple-500" },
    { num: 5, name: "Session", protocols: "NetBIOS, PPTP, RPC", desc: "Manages session establishment, coordination, and termination between applications.", color: "from-blue-600 to-cyan-500" },
    { num: 4, name: "Transport", protocols: "TCP, UDP", desc: "Ensures reliable, end-to-end data transfer, flow control, and error recovery.", color: "from-cyan-600 to-teal-500" },
    { num: 3, name: "Network", protocols: "IP, ICMP, IPSec, Routing", desc: "Handles logical addressing, packet routing, and forwarding across networks.", color: "from-emerald-600 to-green-500" },
    { num: 2, name: "Data Link", protocols: "Ethernet, PPP, Switch, MAC", desc: "Provides physical addressing (MAC), link framing, and error detection.", color: "from-amber-600 to-orange-500" },
    { num: 1, name: "Physical", protocols: "Cables, Hubs, Bits, DSL", desc: "Transmits raw, unstructured bits over physical medium media.", color: "from-orange-600 to-red-500" }
  ];

  // Linux Terminal State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    { command: "system-init", output: "Welcome to StudySphere Linux Terminal Simulator v1.0.0\nType 'ls' to view files, 'cat flag.txt' to solve the lab challenge.", cwd: "/home/student" }
  ]);
  const [currentCwd, setCurrentCwd] = useState("/home/student");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Cryptography Lab State
  const [cryptoAlgo, setCryptoAlgo] = useState<"caesar" | "aes" | "rsa" | "sha256" | "base64">("caesar");
  const [cryptoAction, setCryptoAction] = useState<"encrypt" | "decrypt">("encrypt");
  const [cryptoText, setCryptoText] = useState("");
  const [cryptoKey, setCryptoKey] = useState("3");
  const [cryptoResult, setCryptoResult] = useState("");
  const [cryptoExplanation, setCryptoExplanation] = useState("");
  const [cryptoLoading, setCryptoLoading] = useState(false);

  // Web Security Sandbox State
  const [websecLab, setWebsecLab] = useState<"sqli" | "xss">("sqli");
  const [websecPayload, setWebsecPayload] = useState("");
  const [websecOutput, setWebsecOutput] = useState("");
  const [websecVulnerableSql, setWebsecVulnerableSql] = useState("");
  const [websecSecureSql, setWebsecSecureSql] = useState("");
  const [websecSafe, setWebsecSafe] = useState(false);
  const [websecLoading, setWebsecLoading] = useState(false);

  // SOC Analyst State
  const [socAlerts, setSocAlerts] = useState<SocAlert[]>([]);
  const [socLoading, setSocLoading] = useState(false);

  // Cyber AI Tutor State
  const [tutorMessage, setTutorMessage] = useState("");
  const [tutorChat, setTutorChat] = useState<{ role: "user" | "model"; content: string }[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Auto Scroll Terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Load SOC Alerts
  const fetchSocAlerts = async () => {
    try {
      setSocLoading(true);
      const res = await api.get("/api/cybersecurity/soc-alerts");
      setSocAlerts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSocLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "soc") {
      fetchSocAlerts();
    }
  }, [activeSection]);

  // Packet Flow Simulator state effects
  const startPacketSimulation = () => {
    if (flowState !== "idle" && flowState !== "delivered") return;
    setFlowState("encapsulating");
    setFlowLayer(7);
    addToast("Encapsulating", "Adding headers down the OSI stack...", "info");
  };

  useEffect(() => {
    if (flowState === "encapsulating") {
      const t = setTimeout(() => {
        if (flowLayer > 1) {
          setFlowLayer(prev => prev - 1);
        } else {
          setFlowState("transmitting");
          addToast("Transmitting", "Sending raw bit signals over physical copper cable link...", "info");
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [flowState, flowLayer]);

  useEffect(() => {
    if (flowState === "transmitting") {
      const t = setTimeout(() => {
        setFlowState("decapsulating");
        setFlowLayer(1);
        addToast("Decapsulating", "Stripping frames headers up the receiver stack...", "info");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [flowState]);

  useEffect(() => {
    if (flowState === "decapsulating") {
      const t = setTimeout(() => {
        if (flowLayer < 7) {
          setFlowLayer(prev => prev + 1);
        } else {
          setFlowState("delivered");
          addToast("Delivered", "Packet successfully parsed by application layer!", "success");
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [flowState, flowLayer]);

  // Terminal Handler
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const inputCmd = terminalInput.trim();
    setTerminalInput("");
    setTerminalLoading(true);

    try {
      const res = await api.post("/api/cybersecurity/terminal", { command: inputCmd });
      const newLog = {
        command: inputCmd,
        output: res.data.output,
        cwd: currentCwd
      };
      
      if (res.data.output === "__CLEAR__") {
        setTerminalLogs([]);
      } else {
        setTerminalLogs(prev => [...prev, newLog]);
      }
      
      setCurrentCwd(res.data.cwd);
      setCompletedExercises(res.data.completed);
      
      if (res.data.output.includes("Challenge solved")) {
        addToast("Challenge Solved!", "You solved the flag challenge! +50 XP awarded.", "success");
      }
    } catch (err) {
      console.error(err);
      setTerminalLogs(prev => [...prev, { command: inputCmd, output: "Error executing command.", cwd: currentCwd }]);
    } finally {
      setTerminalLoading(false);
    }
  };

  // Cryptography Handler
  const handleCryptoRun = async () => {
    if (!cryptoText.trim()) return;
    setCryptoLoading(true);
    try {
      const res = await api.post("/api/cybersecurity/cryptography", {
        algorithm: cryptoAlgo,
        action: cryptoAction,
        text: cryptoText,
        key: cryptoKey
      });
      setCryptoResult(res.data.result);
      setCryptoExplanation(res.data.explanation);
    } catch (err: any) {
      addToast("Crypto Error", err.response?.data?.error || "Execution failed.", "error");
    } finally {
      setCryptoLoading(false);
    }
  };

  // Web Security Sandbox Handler
  const handleWebsecRun = async () => {
    if (!websecPayload.trim()) return;
    setWebsecLoading(true);
    try {
      const res = await api.post("/api/cybersecurity/playground", {
        lab: websecLab,
        payload: websecPayload
      });
      setWebsecOutput(res.data.output);
      setWebsecVulnerableSql(res.data.vulnerable_sql);
      setWebsecSecureSql(res.data.secure_sql);
      setWebsecSafe(res.data.is_safe);
    } catch (err) {
      console.error(err);
    } finally {
      setWebsecLoading(false);
    }
  };

  // Cyber AI Tutor Handler
  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorMessage.trim() || tutorLoading) return;

    const userMsg = tutorMessage.trim();
    setTutorMessage("");
    setTutorChat(prev => [...prev, { role: "user", content: userMsg }]);
    setTutorLoading(true);

    try {
      const chatHistory = tutorChat.map(c => ({
        role: c.role,
        parts: [c.content]
      }));
      
      const res = await api.post("/api/cybersecurity/tutor", {
        message: userMsg,
        history: chatHistory
      });
      
      setTutorChat(prev => [...prev, { role: "model", content: res.data.response }]);
    } catch (err) {
      setTutorChat(prev => [...prev, { role: "model", content: "Error connecting to AI Tutor. Check API settings." }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const categories = [
    { id: "networking", label: "Network Security", icon: <BookOpen className="w-6 h-6" />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "OSI model & packets", difficulty: "Beginner" },
    { id: "linux", label: "Linux Terminal", icon: <Terminal className="w-6 h-6" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "CLI skills & forensics", difficulty: "Intermediate" },
    { id: "crypto", label: "Cryptography Lab", icon: <Key className="w-6 h-6" />, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "Ciphers & hashing", difficulty: "Intermediate" },
    { id: "websec", label: "Web Security", icon: <Lock className="w-6 h-6" />, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", desc: "SQLi & XSS attacks", difficulty: "Advanced" },
    { id: "soc", label: "SOC Analysis", icon: <Activity className="w-6 h-6" />, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", desc: "Threat monitoring", difficulty: "Advanced" },
    { id: "tutor", label: "Security AI Tutor", icon: <MessageSquare className="w-6 h-6" />, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", desc: "AI assistant", difficulty: "All Levels" },
    { id: "roadmap", label: "Career Roadmaps", icon: <Compass className="w-6 h-6" />, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20", desc: "Certifications path", difficulty: "All Levels" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-purple-500" /> Cybersecurity Lab
          </h2>
          <p className="text-sm text-slate-400 mt-1">Deepen your defense competencies with interactive networking labs, terminals, and sandboxes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all duration-300 text-left ${
              activeSection === item.id
                ? "bg-[#1a1a2e] border-purple-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] scale-[1.02]"
                : "bg-[#161625] border-white/[0.06] hover:border-purple-500/30 hover:bg-[#1a1a2e]"
            }`}
          >
            <div className={`p-2.5 rounded-xl border ${item.bg} ${item.color} ${item.border}`}>
              {item.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{item.label}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md mt-auto border ${
              item.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              item.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              item.difficulty === "Advanced" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
              "bg-purple-500/10 text-purple-400 border-purple-500/20"
            }`}>
              {item.difficulty}
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* SECTION 1: Networking Lab */}
          {activeSection === "networking" && (
            <motion.div 
              key="networking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">OSI 7-Layer Architecture</h3>
                <div className="flex flex-col gap-2">
                  {osiLayers.map((layer) => {
                    const isActive = activeOsiLayer === layer.num;
                    return (
                      <button
                        key={layer.num}
                        onClick={() => setActiveOsiLayer(layer.num)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isActive
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-100"
                            : "bg-[#161625] border-white/[0.06] hover:bg-[#1a1a2e] text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? "bg-purple-500 text-white" : "bg-[#0f0f1a] text-slate-400"}`}>
                            L{layer.num}
                          </span>
                          <span className="text-sm font-semibold">{layer.name}</span>
                        </div>
                        <span className="text-xs">{layer.protocols.split(",")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-8 bg-[#161625] border border-white/[0.06] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                {(() => {
                  const current = osiLayers.find(l => l.num === activeOsiLayer)!;
                  return (
                    <>
                      <div className="space-y-6">
                        <div className="flex justify-between items-start border-b border-white/[0.06] pb-4">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Layer {current.num}</span>
                            <h4 className="text-xl font-bold text-white mt-1">{current.name} Layer</h4>
                          </div>
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            OSI Stack
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0f0f1a] p-4 rounded-xl border border-white/[0.06]">
                            <span className="text-xs font-bold text-slate-500 uppercase">Core Protocols</span>
                            <p className="text-sm font-semibold text-white mt-2">{current.protocols}</p>
                          </div>
                          <div className="bg-[#0f0f1a] p-4 rounded-xl border border-white/[0.06]">
                            <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                            <p className="text-sm text-slate-300 mt-2">{current.desc}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0f0f1a] p-6 rounded-2xl border border-white/[0.06] space-y-6">
                        <div className="flex justify-between items-center select-none">
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Packet Simulation</span>
                          <button
                            onClick={startPacketSimulation}
                            disabled={flowState !== "idle" && flowState !== "delivered"}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" /> Run Simulation
                          </button>
                        </div>

                        <div className="flex items-center justify-between relative py-4 select-none">
                          <div className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                            flowState === "encapsulating"
                              ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-110"
                              : "bg-[#161625] border-white/[0.06] text-slate-400"
                          }`}>
                            <span>CLIENT</span>
                            <span className="text-[9px] font-black text-purple-400 uppercase mt-1">SENDER</span>
                          </div>
                          
                          <div className="flex-grow h-0.5 border-t-2 border-dashed border-white/20 relative mx-6">
                            {flowState === "transmitting" ? (
                              <motion.div 
                                animate={{ x: ["0%", "100%"] }}
                                transition={{ repeat: 3, duration: 0.6, ease: "linear" }}
                                className="absolute top-[calc(-50%-4px)] w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,1)]"
                              />
                            ) : flowState === "delivered" ? (
                              <div className="absolute left-1/2 -translate-x-1/2 top-[calc(-50%-4px)] w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                            ) : null}
                          </div>

                          <div className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${
                            flowState === "decapsulating"
                              ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-110"
                              : flowState === "delivered"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-[#161625] border-white/[0.06] text-slate-400"
                          }`}>
                            <span>SERVER</span>
                            <span className="text-[9px] font-black text-purple-400 uppercase mt-1">RECEIVER</span>
                          </div>
                        </div>

                        <div className="p-4 bg-[#161625] rounded-xl border border-white/[0.06] space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-sans font-bold border-b border-white/[0.06] pb-2">
                            <span>Active Frame Data</span>
                            <span className="text-purple-400">
                              {flowState === "idle" && "Idle"}
                              {flowState === "encapsulating" && `L${flowLayer} Encapsulating...`}
                              {flowState === "transmitting" && "Transmitting bits..."}
                              {flowState === "decapsulating" && `L${flowLayer} Decapsulating...`}
                              {flowState === "delivered" && "Delivered!"}
                            </span>
                          </div>
                          <div className="text-emerald-400 font-semibold truncate pt-2">
                            {flowState === "idle" && "[Payload Data]"}
                            {flowState === "encapsulating" && (
                              flowLayer === 7 ? "[L7 [Payload]]" :
                              flowLayer === 6 ? "[L6 [L7 [Payload]]]" :
                              flowLayer === 5 ? "[L5 [L6 [L7 [Payload]]]]" :
                              flowLayer === 4 ? "[L4 [L5 [L6 [L7 [Payload]]]]]" :
                              flowLayer === 3 ? "[L3 [L4 [L5 [L6 [L7 [Payload]]]]]]" :
                              flowLayer === 2 ? "[L2 [L3 [L4 [L5 [L6 [L7 [Payload]]]]]]]" :
                              "[L1 [L2 [L3 [L4 [L5 [L6 [L7 [Payload]]]]]]]]"
                            )}
                            {flowState === "transmitting" && "01001000 01100101 01101100 01101100 01101111"}
                            {flowState === "decapsulating" && (
                              flowLayer === 1 ? "[L1 [L2 [L3 [L4 [L5 [L6 [L7 [Payload]]]]]]]]" :
                              flowLayer === 2 ? "[L2 [L3 [L4 [L5 [L6 [L7 [Payload]]]]]]]" :
                              flowLayer === 3 ? "[L3 [L4 [L5 [L6 [L7 [Payload]]]]]]" :
                              flowLayer === 4 ? "[L4 [L5 [L6 [L7 [Payload]]]]]" :
                              flowLayer === 5 ? "[L5 [L6 [L7 [Payload]]]]" :
                              flowLayer === 6 ? "[L6 [L7 [Payload]]]" :
                              "[L7 [Payload]]"
                            )}
                            {flowState === "delivered" && "[Payload Data Received Successfully]"}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* SECTION 2: Linux Command Lab */}
          {activeSection === "linux" && (
            <motion.div 
              key="linux"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Completed Exercises</h3>
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#161625] space-y-4">
                  <p className="text-xs text-slate-400">Execute basic terminal tasks locally to trigger achievements.</p>
                  
                  <div className="space-y-3">
                    {[
                      { id: "ls", name: "ls (List Directory)" },
                      { id: "cd", name: "cd (Change Directory)" },
                      { id: "cat", name: "cat (Read Files)" },
                      { id: "touch", name: "touch (Create File)" },
                      { id: "solve_flag", name: "Read Flag (Find Secret)" }
                    ].map((ex) => {
                      const isDone = completedExercises.includes(ex.id);
                      return (
                        <div key={ex.id} className="flex items-center justify-between text-sm">
                          <span className={`${isDone ? "text-emerald-400 font-semibold" : "text-slate-400"}`}>{ex.name}</span>
                          {isDone ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-white/[0.1]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col h-[500px] rounded-2xl border border-white/[0.06] bg-[#0a0a12] font-mono shadow-2xl overflow-hidden">
                <div className="h-12 bg-[#0f0f1a] border-b border-white/[0.06] px-4 flex items-center justify-between text-xs text-slate-400 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-3 font-bold">student@studysphere: {currentCwd}</span>
                  </div>
                  <span className="font-bold">BASH</span>
                </div>

                <div className="flex-grow p-4 overflow-y-auto text-sm text-emerald-400 space-y-3 scrollbar-thin">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="space-y-1">
                      {log.command !== "system-init" && (
                        <div className="flex items-center gap-2 text-purple-400 font-bold select-none">
                          <span>$</span>
                          <span className="text-white">{log.command}</span>
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300 font-mono">{log.output}</pre>
                    </div>
                  ))}
                  {terminalLoading && (
                    <div className="text-xs text-slate-500 animate-pulse font-mono">Executing...</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                <form onSubmit={handleTerminalSubmit} className="h-12 bg-[#0f0f1a] border-t border-white/[0.06] flex items-center px-4 gap-3">
                  <span className="text-purple-400 font-bold text-sm font-mono">$</span>
                  <input 
                    type="text" 
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className="flex-grow bg-transparent border-none outline-none font-mono text-sm text-white placeholder-slate-600"
                    placeholder="Enter command (ls, cd, cat flag.txt)..."
                    disabled={terminalLoading}
                  />
                  <button type="submit" className="hidden" />
                </form>
              </div>
            </motion.div>
          )}

          {/* SECTION 3: Cryptography Lab */}
          {activeSection === "crypto" && (
            <motion.div 
              key="crypto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cipher Modules</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "caesar", name: "Caesar Shift Cipher" },
                    { id: "aes", name: "AES-256 Symmetric" },
                    { id: "rsa", name: "RSA Asymmetric" },
                    { id: "sha256", name: "SHA-256 Hash" },
                    { id: "base64", name: "Base64 Encoder" }
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => {
                        setCryptoAlgo(algo.id as any);
                        setCryptoResult("");
                        setCryptoExplanation("");
                      }}
                      className={`p-4 rounded-xl border text-left text-sm font-bold transition-all ${
                        cryptoAlgo === algo.id
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-100"
                          : "bg-[#161625] border-white/[0.06] hover:bg-[#1a1a2e] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {algo.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 p-6 rounded-2xl border border-white/[0.06] bg-[#161625] shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                  <h4 className="text-lg font-bold text-white capitalize">
                    {cryptoAlgo} Lab
                  </h4>
                  {cryptoAlgo !== "sha256" && (
                    <div className="flex bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06]">
                      <button 
                        onClick={() => setCryptoAction("encrypt")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          cryptoAction === "encrypt" ? "bg-white/[0.1] text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Encrypt
                      </button>
                      <button 
                        onClick={() => setCryptoAction("decrypt")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                          cryptoAction === "decrypt" ? "bg-white/[0.1] text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Decrypt
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Input Text</label>
                    <textarea 
                      rows={5}
                      value={cryptoText}
                      onChange={(e) => setCryptoText(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-[#0f0f1a] border border-white/[0.06] rounded-xl outline-none text-white focus:border-purple-500/50 resize-none"
                      placeholder="Enter raw text message..."
                    />
                  </div>

                  <div className="space-y-6">
                    {["caesar", "aes", "rsa"].includes(cryptoAlgo) && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Cipher Key</label>
                        <input 
                          type="text" 
                          value={cryptoKey}
                          onChange={(e) => setCryptoKey(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-[#0f0f1a] border border-white/[0.06] rounded-xl outline-none text-white focus:border-purple-500/50"
                          placeholder={cryptoAlgo === "caesar" ? "Integer (e.g., 3)" : "Password"}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={handleCryptoRun}
                      disabled={cryptoLoading}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2"
                    >
                      {cryptoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      Execute
                    </button>
                  </div>
                </div>

                {cryptoResult && (
                  <div className="border-t border-white/[0.06] pt-6 space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Result Output</span>
                      <div className="p-4 bg-[#0f0f1a] border border-white/[0.06] rounded-xl font-mono text-sm text-emerald-400 break-all flex items-start justify-between gap-4">
                        <span>{cryptoResult}</span>
                        <Copy 
                          onClick={() => {
                            navigator.clipboard.writeText(cryptoResult);
                            addToast("Copied!", "Output copied to clipboard.", "info");
                          }}
                          className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Explanation</span>
                      <p className="text-sm text-slate-300 bg-[#0f0f1a] p-4 rounded-xl border border-white/[0.06] leading-relaxed">{cryptoExplanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION 4: Web Security Lab */}
          {activeSection === "websec" && (
            <motion.div 
              key="websec"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vulnerabilities</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setWebsecLab("sqli"); setWebsecOutput(""); setWebsecPayload(""); }}
                    className={`p-4 rounded-xl border text-left text-sm font-bold transition-all ${
                      websecLab === "sqli" ? "bg-purple-500/10 border-purple-500/40 text-purple-100" : "bg-[#161625] border-white/[0.06] hover:bg-[#1a1a2e] text-slate-400"
                    }`}
                  >
                    SQL Injection Simulator
                  </button>
                  <button
                    onClick={() => { setWebsecLab("xss"); setWebsecOutput(""); setWebsecPayload(""); }}
                    className={`p-4 rounded-xl border text-left text-sm font-bold transition-all ${
                      websecLab === "xss" ? "bg-purple-500/10 border-purple-500/40 text-purple-100" : "bg-[#161625] border-white/[0.06] hover:bg-[#1a1a2e] text-slate-400"
                    }`}
                  >
                    Cross-Site Scripting (XSS)
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 p-6 rounded-2xl border border-white/[0.06] bg-[#161625] shadow-sm space-y-6">
                <div className="border-b border-white/[0.06] pb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase">Educational Lab</span>
                  <h4 className="text-xl font-bold text-white mt-1">
                    {websecLab === "sqli" ? "SQL Injection Prevention" : "DOM Output Sanitization"}
                  </h4>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {websecLab === "sqli" ? "Username Payload" : "HTML/Script Payload"}
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={websecPayload}
                        onChange={(e) => setWebsecPayload(e.target.value)}
                        className="flex-grow px-4 py-3 text-sm bg-[#0f0f1a] border border-white/[0.06] rounded-xl outline-none text-white focus:border-purple-500/50"
                        placeholder={websecLab === "sqli" ? "' OR '1'='1" : "<script>alert('xss')</script>"}
                      />
                      <button
                        onClick={handleWebsecRun}
                        disabled={websecLoading}
                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-sm font-bold flex items-center justify-center min-w-[120px]"
                      >
                        {websecLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inject"}
                      </button>
                    </div>
                  </div>

                  {websecOutput && (
                    <div className="space-y-6 border-t border-white/[0.06] pt-6">
                      <div className={`p-4 rounded-xl border text-sm font-semibold ${
                        websecSafe 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {websecOutput}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                          <span className="text-xs font-bold text-rose-500 uppercase">Vulnerable Logic</span>
                          <pre className="text-xs font-mono whitespace-pre-wrap text-rose-400 leading-relaxed bg-[#0a0a12] p-4 rounded-lg border border-white/[0.06]">{websecVulnerableSql}</pre>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                          <span className="text-xs font-bold text-emerald-500 uppercase">Secure Mitigation</span>
                          <pre className="text-xs font-mono whitespace-pre-wrap text-emerald-400 leading-relaxed bg-[#0a0a12] p-4 rounded-lg border border-white/[0.06]">{websecSecureSql}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 5: SOC Analyst Dashboard */}
          {activeSection === "soc" && (
            <motion.div 
              key="soc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Active Threats Monitor", val: "Critical (Red Alert)", color: "text-rose-500" },
                  { label: "Alert status counts", val: `${socAlerts.length} Active incidents`, color: "text-amber-500" },
                  { label: "Intrusion system shield", val: "Operational", color: "text-emerald-500" }
                ].map((m, idx) => (
                  <div key={idx} className="p-6 rounded-2xl border border-white/[0.06] bg-[#161625] shadow-sm flex flex-col justify-between h-32">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                    <span className={`text-lg font-bold ${m.color}`}>{m.val}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#161625] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Firewall Event Intrusion Log</h3>
                  <button onClick={fetchSocAlerts} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-slate-400 text-xs uppercase font-semibold">
                        <th className="py-3">Severity</th>
                        <th className="py-3">Signature Alert</th>
                        <th className="py-3">Source IP</th>
                        <th className="py-3">Destination IP</th>
                        <th className="py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-slate-300">
                      {socAlerts.map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                              a.severity === "critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              a.severity === "high" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                              a.severity === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="py-4 font-semibold">{a.signature}</td>
                          <td className="py-4 font-mono text-xs text-purple-300">{a.source}</td>
                          <td className="py-4 font-mono text-xs text-purple-300">{a.destination}</td>
                          <td className="py-4 text-slate-500 text-xs">{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECTION 6: Cyber AI Tutor Chat */}
          {activeSection === "tutor" && (
            <motion.div 
              key="tutor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-[600px] rounded-2xl border border-white/[0.06] bg-[#161625] shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] bg-[#0f0f1a] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">AI Cyber Security Analyst Tutor</h4>
                  <p className="text-xs text-slate-400 mt-1">Queries cryptographic details, web vulnerabilities defenses, or Linux terminal setups.</p>
                </div>
              </div>

              <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {tutorChat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <MessageSquare className="w-12 h-12 text-purple-500/30" />
                    <p className="text-sm text-slate-400 max-w-md leading-relaxed">Ask me any beginner to advanced questions. Examples: "Explain Diffie-Hellman Key Exchange", or "What is CSRF and how do we prevent it?"</p>
                  </div>
                ) : (
                  tutorChat.map((msg, index) => {
                    const isModel = msg.role === "model";
                    return (
                      <div key={index} className={`flex ${isModel ? "justify-start" : "justify-end"}`}>
                        <div className={`p-4 rounded-2xl text-sm max-w-xl leading-relaxed border ${
                          isModel 
                            ? "bg-[#0f0f1a] border-white/[0.06] text-slate-300 rounded-tl-none" 
                            : "bg-purple-600 border-purple-500 text-white rounded-tr-none shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                {tutorLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-[#0f0f1a] border border-white/[0.06] text-slate-400 text-sm rounded-tl-none flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleTutorSubmit} className="p-4 border-t border-white/[0.06] bg-[#0f0f1a] flex gap-3">
                <input 
                  type="text" 
                  value={tutorMessage}
                  onChange={(e) => setTutorMessage(e.target.value)}
                  className="flex-grow px-4 py-3 text-sm bg-[#161625] border border-white/[0.06] rounded-xl outline-none text-white focus:border-purple-500/50"
                  placeholder="Ask the Cyber AI tutor..."
                  disabled={tutorLoading}
                />
                <button 
                  type="submit"
                  disabled={tutorLoading || !tutorMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
                >
                  Ask
                </button>
              </form>
            </motion.div>
          )}

          {/* SECTION 7: Roadmap */}
          {activeSection === "roadmap" && (
            <motion.div 
              key="roadmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none"
            >
              {[
                { title: "SOC Analyst Level 1", desc: "Defend and monitor corporate network systems. Log analysis skills, SIEM platforms, and firewalls configurations.", certs: "CompTIA Security+, CySA+, Cisco CyberOps", skills: ["Log Forensics", "Wireshark", "Threat Intelligence", "Incident Response"], badge: "GOLD CERT", color: "amber" },
                { title: "Offensive Penetration Tester", desc: "Ethical hacking and systems vulnerability discovery simulations. Buffer overflows, web application bugs, and custom exploits scripts.", certs: "OSCP, eJPT, CEH Practical", skills: ["Nmap", "Metasploit", "Burp Suite", "Privilege Escalation"], badge: "PRO ACCESS", color: "purple" }
              ].map((map, idx) => {
                const labPercent = Math.round((completedExercises.length / 5) * 100);
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-white/[0.06] bg-[#161625] shadow-xl space-y-5 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 mb-4">
                        <h4 className="text-lg font-bold text-white">{map.title}</h4>
                        <span className={`px-2.5 py-1 rounded-md bg-${map.color}-500/10 text-${map.color}-400 border border-${map.color}-500/20 text-[10px] font-bold font-mono tracking-wider`}>{map.badge}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">{map.desc}</p>
                      
                      <div className="space-y-2 mb-6">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Certifications</span>
                        <p className="text-sm font-bold text-purple-300">{map.certs}</p>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Required Tools & Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {map.skills.map((s) => (
                            <span key={s} className="text-[10px] font-bold font-mono px-3 py-1.5 bg-[#0f0f1a] border border-white/[0.06] text-slate-300 rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-6 mt-6 border-t border-white/[0.06]">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Linux CLI Lab Training Progress</span>
                        <span className="font-bold font-mono text-white">{labPercent}% Completed</span>
                      </div>
                      <div className="w-full bg-[#0f0f1a] h-2 rounded-full overflow-hidden border border-white/[0.06]">
                        <div 
                          className="bg-gradient-to-r from-violet-600 to-purple-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${labPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
};
