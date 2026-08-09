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
  HelpCircle,
  HelpCircle as QuizIcon,
  MessageSquare,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Play,
  Copy,
  ChevronRight,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  BookMarked
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
    { num: 7, name: "Application", protocols: "HTTP, DNS, SMTP, FTP", desc: "User interface and application interactions. Directly handles end-user inputs.", color: "from-indigo-650 to-indigo-500" },
    { num: 6, name: "Presentation", protocols: "SSL, TLS, JPEG, ASCII", desc: "Data translation, compression, and encryption/decryption validation.", color: "from-violet-600 to-indigo-500" },
    { num: 5, name: "Session", protocols: "NetBIOS, PPTP, RPC", desc: "Manages session establishment, coordination, and termination between applications.", color: "from-purple-650 to-indigo-500" },
    { num: 4, name: "Transport", protocols: "TCP, UDP", desc: "Ensures reliable, end-to-end data transfer, flow control, and error recovery.", color: "from-fuchsia-600 to-indigo-500" },
    { num: 3, name: "Network", protocols: "IP, ICMP, IPSec, Routing", desc: "Handles logical addressing, packet routing, and forwarding across networks.", color: "from-pink-600 to-indigo-500" },
    { num: 2, name: "Data Link", protocols: "Ethernet, PPP, Switch, MAC", desc: "Provides physical addressing (MAC), link framing, and error detection.", color: "from-rose-600 to-indigo-500" },
    { num: 1, name: "Physical", protocols: "Cables, Hubs, Bits, DSL", desc: "Transmits raw, unstructured bits over physical medium media.", color: "from-amber-600 to-orange-500" }
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

  return (
    <div className="flex-grow p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full overflow-y-auto">
      
      {/* Header and Section Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500 animate-pulse" /> Cybersecurity Learning Center
          </h2>
          <p className="text-xs text-slate-450 mt-1">Deepen your defense competencies with interactive networking labs, terminals, and sandboxes.</p>
        </div>
      </div>

      {/* Lab Nav Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { id: "networking", label: "Networking", icon: <BookOpen className="w-4 h-4" /> },
          { id: "linux", label: "Linux Term", icon: <Terminal className="w-4 h-4" /> },
          { id: "crypto", label: "Cryptography", icon: <Key className="w-4 h-4" /> },
          { id: "websec", label: "Web Security", icon: <Lock className="w-4 h-4" /> },
          { id: "soc", label: "SOC Dashboard", icon: <Activity className="w-4 h-4" /> },
          { id: "tutor", label: "AI Tutor", icon: <MessageSquare className="w-4 h-4" /> },
          { id: "roadmap", label: "Roadmaps", icon: <Compass className="w-4 h-4" /> }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all focus:outline-none ${
              activeSection === item.id
                ? "bg-indigo-600 border-indigo-650 text-white shadow-md shadow-indigo-600/10"
                : "border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* SECTION 1: Networking Lab */}
          {activeSection === "networking" && (
            <motion.div 
              key="networking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Layers List */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OSI 7-Layer Architecture</h3>
                <div className="flex flex-col gap-2">
                  {osiLayers.map((layer) => {
                    const isActive = activeOsiLayer === layer.num;
                    return (
                      <button
                        key={layer.num}
                        onClick={() => setActiveOsiLayer(layer.num)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all focus:outline-none ${
                          isActive
                            ? "border-indigo-500 bg-indigo-500/5 text-indigo-500"
                            : "border-slate-200 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-900 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold w-6 h-6 rounded-full bg-slate-200/50 dark:bg-slate-850 flex items-center justify-center">
                            L{layer.num}
                          </span>
                          <span className="text-xs font-bold">{layer.name} Layer</span>
                        </div>
                        <span className="text-[9px] text-slate-400">{layer.protocols.split(",")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layer Explanation panel */}
              <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between space-y-6">
                {(() => {
                  const current = osiLayers.find(l => l.num === activeOsiLayer)!;
                  return (
                    <>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Layer {current.num} Definition</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">{current.name} Layer</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-500">
                            OSI Stack
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Core Protocols / Standards</span>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">{current.protocols}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Summary Explanation</span>
                          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{current.desc}</p>
                        </div>
                      </div>

                      {/* Packet Flow Visualizer */}
                      <div className="p-4.5 rounded-2xl bg-[#161720]/40 border border-white/5 space-y-4">
                        <div className="flex justify-between items-center select-none">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">OSI Packet Simulation</span>
                          <button
                            onClick={startPacketSimulation}
                            disabled={flowState !== "idle" && flowState !== "delivered"}
                            className="px-3 h-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10"
                          >
                            <Play className="w-2.5 h-2.5" /> Run Simulation
                          </button>
                        </div>

                        <div className="flex items-center justify-between relative py-2 select-none">
                          {/* Sender Panel */}
                          <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold transition-all ${
                            flowState === "encapsulating"
                              ? "bg-indigo-600 border-indigo-500 text-white scale-105"
                              : "bg-slate-900 border-white/5 text-slate-300"
                          }`}>
                            <span>CLIENT</span>
                            <span className="text-[7px] font-black text-indigo-400 uppercase mt-0.5">SENDER</span>
                          </div>
                          
                          {/* Dotted link line with dynamic animation */}
                          <div className="flex-grow h-0.5 border-t border-dashed border-white/10 relative mx-4">
                            {flowState === "transmitting" ? (
                              <motion.div 
                                animate={{ x: ["0%", "100%"] }}
                                transition={{ repeat: 3, duration: 0.6, ease: "linear" }}
                                className="absolute top-[-3.5px] w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-550/50"
                              />
                            ) : flowState === "delivered" ? (
                              <div className="absolute left-1/2 -translate-x-1/2 top-[-4px] w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20" />
                            ) : null}
                          </div>

                          {/* Receiver Panel */}
                          <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold transition-all ${
                            flowState === "decapsulating"
                              ? "bg-indigo-600 border-indigo-500 text-white scale-105"
                              : flowState === "delivered"
                              ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-900 border-white/5 text-slate-300"
                          }`}>
                            <span>SERVER</span>
                            <span className="text-[7px] font-black text-indigo-400 uppercase mt-0.5">RECEIVER</span>
                          </div>
                        </div>

                        {/* Interactive Network Topology Map */}
                        <div className="flex flex-col items-center justify-between border border-white/5 rounded-xl p-4 bg-slate-950/20 space-y-4">
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Interactive Network Topology Map</span>
                          <svg className="w-full h-32 max-w-lg" viewBox="0 0 500 120">
                            {/* Lines / Links */}
                            <line x1="60" y1="60" x2="180" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <line x1="60" y1="60" x2="180" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <line x1="180" y1="30" x2="320" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <line x1="180" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <line x1="320" y1="30" x2="440" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                            <line x1="320" y1="90" x2="440" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

                            {/* Active Transmitting Links with Glow */}
                            {flowState === "transmitting" && (
                              <>
                                <motion.line 
                                  x1="60" y1="60" x2="180" y2="30" 
                                  stroke="#8B5CF6" strokeWidth="2" 
                                  strokeDasharray="4 4" 
                                  animate={{ strokeDashoffset: [0, -20] }} 
                                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                                />
                                <motion.line 
                                  x1="180" y1="30" x2="320" y2="30" 
                                  stroke="#8B5CF6" strokeWidth="2" 
                                  strokeDasharray="4 4" 
                                  animate={{ strokeDashoffset: [0, -20] }} 
                                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                                />
                                <motion.line 
                                  x1="320" y1="30" x2="440" y2="60" 
                                  stroke="#8B5CF6" strokeWidth="2" 
                                  strokeDasharray="4 4" 
                                  animate={{ strokeDashoffset: [0, -20] }} 
                                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                                />
                              </>
                            )}

                            {/* Packet Animating Node Dots */}
                            {flowState === "transmitting" && (
                              <motion.circle 
                                r="4" 
                                fill="#A855F7" 
                                animate={{ 
                                  cx: [60, 180, 320, 440], 
                                  cy: [60, 30, 30, 60] 
                                }} 
                                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} 
                              />
                            )}

                            {/* Node points */}
                            <circle cx="60" cy="60" r="10" fill="#1e1b4b" stroke="#8B5CF6" strokeWidth="2" />
                            <text x="60" y="64" fill="#a78bfa" fontSize="8" textAnchor="middle" fontWeight="bold">Host</text>

                            <circle cx="180" cy="30" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="180" y="33" fill="#94a3b8" fontSize="6" textAnchor="middle">Sw1</text>

                            <circle cx="180" cy="90" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="180" y="93" fill="#94a3b8" fontSize="6" textAnchor="middle">Sw2</text>

                            <circle cx="320" cy="30" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="320" y="33" fill="#94a3b8" fontSize="6" textAnchor="middle">Rt1</text>

                            <circle cx="320" cy="90" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="320" y="93" fill="#94a3b8" fontSize="6" textAnchor="middle">Rt2</text>

                            <circle cx="440" cy="60" r="10" fill="#064e3b" stroke="#10B981" strokeWidth="2" />
                            <text x="440" y="64" fill="#34d399" fontSize="8" textAnchor="middle" fontWeight="bold">Serv</text>
                          </svg>
                        </div>

                        {/* Packet construction display */}
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1.5 font-mono text-[9px] select-text">
                          <div className="flex justify-between items-center text-[8px] text-slate-550 uppercase font-sans font-bold select-none border-b border-white/5 pb-1">
                            <span>Active Frame Data</span>
                            <span className="text-indigo-400">
                              {flowState === "idle" && "Idle"}
                              {flowState === "encapsulating" && `L${flowLayer} Encapsulating...`}
                              {flowState === "transmitting" && "Transmitting bits..."}
                              {flowState === "decapsulating" && `L${flowLayer} Decapsulating...`}
                              {flowState === "delivered" && "Delivered!"}
                            </span>
                          </div>
                          <div className="text-slate-300 truncate font-semibold leading-relaxed">
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Exercises Tracker */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Exercises</h3>
                <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
                  <p className="text-[10px] text-slate-450">Execute basic terminal tasks locally to trigger achievements.</p>
                  
                  <div className="space-y-2">
                    {[
                      { id: "ls", name: "ls (List Directory)" },
                      { id: "cd", name: "cd (Change Directory)" },
                      { id: "cat", name: "cat (Read Files)" },
                      { id: "touch", name: "touch (Create File)" },
                      { id: "solve_flag", name: "Read Flag (Find Secret Flag)" }
                    ].map((ex) => {
                      const isDone = completedExercises.includes(ex.id);
                      return (
                        <div key={ex.id} className="flex items-center justify-between text-xs">
                          <span className={`${isDone ? "text-emerald-500 font-semibold" : "text-slate-500"}`}>{ex.name}</span>
                          {isDone ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Terminal Simulator Console */}
              <div className="lg:col-span-8 flex flex-col h-[400px] rounded-2xl border border-white/5 bg-[#09090b] font-mono shadow-2xl overflow-hidden relative">
                {/* Header bar */}
                <div className="h-10 bg-[#11121a] border-b border-white/5 px-4 flex items-center justify-between text-[10px] text-slate-500 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="ml-2 font-bold font-mono text-slate-400">student@studysphere-cli: {currentCwd}</span>
                  </div>
                  <span className="font-bold">BASH</span>
                </div>

                {/* Output log */}
                <div className="flex-grow p-4 overflow-y-auto text-[10.5px] text-emerald-400 space-y-2.5 scrollbar-thin select-text">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="space-y-1">
                      {log.command !== "system-init" && (
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold select-none">
                          <span>$</span>
                          <span className="text-slate-300">{log.command}</span>
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300/90 font-mono" style={{ textShadow: "0 0 4px rgba(52, 211, 153, 0.15)" }}>{log.output}</pre>
                    </div>
                  ))}
                  {terminalLoading && (
                    <div className="text-[10px] text-slate-500 animate-pulse select-none font-mono">Executing system operations...</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                {/* Input prompt form */}
                <form onSubmit={handleTerminalSubmit} className="h-10 bg-[#11121a]/60 border-t border-white/5 flex items-center px-4 gap-2 select-none">
                  <span className="text-indigo-400 font-bold text-[11px] font-mono">$</span>
                  <input 
                    type="text" 
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className="flex-grow bg-transparent border-none outline-none font-mono text-[11px] text-slate-100 placeholder-slate-700"
                    placeholder="Enter bash command (ls, cd, pwd, cat flag.txt)..."
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Algorithm select list */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cipher Modules</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "caesar", name: "Caesar Shift Cipher" },
                    { id: "aes", name: "AES-256 Symmetric Cipher" },
                    { id: "rsa", name: "RSA Asymmetric Cipher" },
                    { id: "sha256", name: "SHA-256 Hash Algorithm" },
                    { id: "base64", name: "Base64 Encoder" }
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => {
                        setCryptoAlgo(algo.id as any);
                        setCryptoResult("");
                        setCryptoExplanation("");
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all focus:outline-none ${
                        cryptoAlgo === algo.id
                          ? "border-indigo-500 bg-indigo-500/5 text-indigo-500"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-900 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {algo.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Encryption form */}
              <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                    {cryptoAlgo} lab playground
                  </h4>
                  {cryptoAlgo !== "sha256" && (
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
                      <button 
                        onClick={() => setCryptoAction("encrypt")}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                          cryptoAction === "encrypt" ? "bg-white dark:bg-slate-900 shadow text-indigo-500" : "text-slate-400"
                        }`}
                      >
                        Encrypt / Encode
                      </button>
                      <button 
                        onClick={() => setCryptoAction("decrypt")}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                          cryptoAction === "decrypt" ? "bg-white dark:bg-slate-900 shadow text-indigo-500" : "text-slate-400"
                        }`}
                      >
                        Decrypt / Decode
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Input Text</label>
                    <textarea 
                      rows={3}
                      value={cryptoText}
                      onChange={(e) => setCryptoText(e.target.value)}
                      className="w-full px-4 py-2 text-xs bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      placeholder="Enter raw text message to crypt..."
                    />
                  </div>

                  <div className="space-y-4">
                    {["caesar", "aes", "rsa"].includes(cryptoAlgo) && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Cipher Key (Password)</label>
                        <input 
                          type="text" 
                          value={cryptoKey}
                          onChange={(e) => setCryptoKey(e.target.value)}
                          className="w-full px-4 py-2 text-xs bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                          placeholder={cryptoAlgo === "caesar" ? "Integer (e.g., 3)" : "Encryption Password"}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={handleCryptoRun}
                      disabled={cryptoLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      {cryptoLoading ? "Processing..." : "Run Encryption Output"}
                    </button>
                  </div>
                </div>

                {cryptoResult && (
                  <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-4 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Result Output Payload</span>
                      <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-[10px] text-slate-700 dark:text-slate-400 break-all select-all flex items-center justify-between">
                        <span>{cryptoResult}</span>
                        <Copy 
                          onClick={() => {
                            navigator.clipboard.writeText(cryptoResult);
                            addToast("Copied!", "Output payload copied to clipboard.", "info");
                          }}
                          className="w-4 h-4 text-slate-400 hover:text-indigo-500 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Cryptographic Logic Explanation</span>
                      <p className="text-xs text-slate-500">{cryptoExplanation}</p>
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Vulnerabilities select grid */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">vulnerabilities labs</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setWebsecLab("sqli"); setWebsecOutput(""); setWebsecPayload(""); }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      websecLab === "sqli" ? "border-indigo-500 bg-indigo-500/5 text-indigo-500" : "border-slate-200 dark:border-slate-850 text-slate-600"
                    }`}
                  >
                    SQL Injection Simulator
                  </button>
                  <button
                    onClick={() => { setWebsecLab("xss"); setWebsecOutput(""); setWebsecPayload(""); }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      websecLab === "xss" ? "border-indigo-500 bg-indigo-500/5 text-indigo-500" : "border-slate-200 dark:border-slate-850 text-slate-600"
                    }`}
                  >
                    Cross-Site Scripting (XSS)
                  </button>
                </div>
              </div>

              {/* Vulnerability playground simulator */}
              <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
                <div className="border-b pb-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Educational Lab</span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    {websecLab === "sqli" ? "Secure Parameterized Queries vs Injections" : "DOM Output Sanitizations"}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      {websecLab === "sqli" ? "Enter SQL Username Payload" : "Enter HTML/Script Output Payload"}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={websecPayload}
                        onChange={(e) => setWebsecPayload(e.target.value)}
                        className="flex-grow px-4 py-2 text-xs bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                        placeholder={websecLab === "sqli" ? "' OR '1'='1" : "<script>alert('xss')</script>"}
                      />
                      <button
                        onClick={handleWebsecRun}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                      >
                        Submit
                      </button>
                    </div>
                  </div>

                  {websecOutput && (
                    <div className="space-y-4 border-t pt-4">
                      
                      {/* Simulation result */}
                      <div className={`p-4 rounded-xl border text-xs font-semibold ${
                        websecSafe 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}>
                        {websecOutput}
                      </div>

                      {/* Code comparison grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                          <span className="text-[9px] font-bold text-rose-500 uppercase">VULNERABLE CODE LOGIC</span>
                          <pre className="text-[9px] font-mono whitespace-pre-wrap text-rose-650 dark:text-rose-450 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">{websecVulnerableSql}</pre>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                          <span className="text-[9px] font-bold text-emerald-500 uppercase">SECURE MITIGATION CODE</span>
                          <pre className="text-[9px] font-mono whitespace-pre-wrap text-emerald-650 dark:text-emerald-450 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">{websecSecureSql}</pre>
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
              {/* Alert Metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Active Threats Monitor", val: "Critical (Red Alert)", color: "text-rose-500" },
                  { label: "Alert status counts", val: `${socAlerts.length} Active incidents`, color: "text-amber-500" },
                  { label: "Intrusion system shield", val: "Operational", color: "text-emerald-500" }
                ].map((m, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{m.label}</span>
                    <span className={`text-sm font-extrabold ${m.color}`}>{m.val}</span>
                  </div>
                ))}
              </div>

              {/* Alerts Log list Table */}
              <div className="p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Firewall Event Intrusion Log</h3>
                  <button onClick={fetchSocAlerts} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-2.5">Severity</th>
                        <th className="py-2.5">Signature Alert</th>
                        <th className="py-2.5">Source IP</th>
                        <th className="py-2.5">Destination IP</th>
                        <th className="py-2.5">Time Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-400">
                      {socAlerts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              a.severity === "critical" ? "bg-rose-500/10 text-rose-500" :
                              a.severity === "high" ? "bg-orange-500/10 text-orange-500" :
                              a.severity === "medium" ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-500/10 text-slate-500"
                            }`}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="py-3 font-semibold">{a.signature}</td>
                          <td className="py-3 font-mono text-[10px]">{a.source}</td>
                          <td className="py-3 font-mono text-[10px]">{a.destination}</td>
                          <td className="py-3 text-slate-400">{a.time}</td>
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
              className="flex flex-col h-[500px] rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden"
            >
              {/* Tutor banner info */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">AI Cyber Security Analyst Tutor</h4>
                  <p className="text-[9px] text-slate-450 mt-0.5">Queries cryptographic details, web vulnerabilities defenses, or Linux terminal setups.</p>
                </div>
              </div>

              {/* Chat conversations display */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4">
                {tutorChat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                    <MessageSquare className="w-10 h-10 text-indigo-500/35" />
                    <p className="text-xs text-slate-450 max-w-sm">Ask me any beginner to advanced questions. Examples: "Explain Diffie-Hellman Key Exchange", or "What is CSRF and how do we prevent it?"</p>
                  </div>
                ) : (
                  tutorChat.map((msg, index) => {
                    const isModel = msg.role === "model";
                    return (
                      <div key={index} className={`flex ${isModel ? "justify-start" : "justify-end"}`}>
                        <div className={`p-4 rounded-2xl text-xs max-w-xl leading-relaxed border ${
                          isModel 
                            ? "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-400 rounded-tl-none" 
                            : "bg-indigo-600 border-indigo-650 text-white rounded-tr-none shadow-sm shadow-indigo-600/10"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                {tutorLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 text-slate-450 text-xs rounded-tl-none animate-pulse flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt box form */}
              <form onSubmit={handleTutorSubmit} className="p-4 border-t border-slate-100 dark:border-slate-850 flex gap-3">
                <input 
                  type="text" 
                  value={tutorMessage}
                  onChange={(e) => setTutorMessage(e.target.value)}
                  className="flex-grow px-4 py-2.5 text-xs bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  placeholder="Ask the Cyber AI tutor..."
                  disabled={tutorLoading}
                />
                <button 
                  type="submit"
                  disabled={tutorLoading || !tutorMessage.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600 text-white rounded-xl text-xs font-bold"
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
              className="grid grid-cols-1 md:grid-cols-2 gap-8 select-none"
            >
              {[
                { title: "SOC Analyst Level 1", desc: "Defend and monitor corporate network systems. Log analysis skills, SIEM platforms, and firewalls configurations.", certs: "CompTIA Security+, CySA+, Cisco CyberOps", skills: ["Log Forensics", "Wireshark", "Threat Intelligence", "Incident Response"], badge: "GOLD CERT" },
                { title: "Offensive Penetration Tester", desc: "Ethical hacking and systems vulnerability discovery simulations. Buffer overflows, web application bugs, and custom exploits scripts.", certs: "OSCP, eJPT, CEH Practical", skills: ["Nmap", "Metasploit", "Burp Suite", "Privilege Escalation"], badge: "PRO ACCESS" }
              ].map((map, idx) => {
                const labPercent = Math.round((completedExercises.length / 5) * 100);
                return (
                  <div key={idx} className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4 hover:border-indigo-500/25 transition-all">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="text-xs font-black text-white">{map.title}</h4>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[8px] font-black font-mono tracking-wider">{map.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{map.desc}</p>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Target Certifications</span>
                      <p className="text-xs font-bold text-indigo-300">{map.certs}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide font-sans">Required Tools & Skills</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {map.skills.map((s) => (
                          <span key={s} className="text-[8px] font-bold font-mono px-2 py-0.5 bg-[#181922] border border-white/5 text-slate-350 rounded-lg">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>Linux CLI Lab Training Progress</span>
                        <span className="font-bold font-mono text-slate-300">{labPercent}% Completed</span>
                      </div>
                      <div className="w-full bg-[#181922] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
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

    </div>
  );
};
