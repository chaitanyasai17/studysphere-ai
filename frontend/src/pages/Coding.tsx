import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import Editor from "@monaco-editor/react";
import {
  Play,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  BookOpen,
  Terminal,
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Gauge,
  Cpu,
  Plus,
  Trash2,
  Edit,
  FolderOpen,
  Keyboard,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Code2
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  desc: string;
  template: Record<string, string>;
}

interface PlayFile {
  name: string;
  content: string;
  language: string;
}

const langToExt: Record<string, string> = {
  python: "py",
  java: "java",
  c: "c",
  cpp: "cpp",
  javascript: "js",
  typescript: "ts",
  go: "go",
  rust: "rs",
  php: "php",
  ruby: "rb",
  kotlin: "kt",
  swift: "swift",
  csharp: "cs",
  sql: "sql",
  bash: "sh"
};

const playTemplates: Record<string, string> = {
  python: `print("Hello")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello";\n    return 0;\n}`,
  javascript: `console.log("Hello");`,
  typescript: `console.log("Hello");`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello")\n}`,
  rust: `fn main() {\n    println!("Hello");\n}`,
  php: `<?php\necho "Hello";\n?>`,
  ruby: `puts "Hello"`,
  kotlin: `fun main() {\n    println("Hello")\n}`,
  swift: `print("Hello")`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello");\n    }\n}`,
  sql: `SELECT 'Hello';`,
  bash: `echo Hello`
};

export const CodingPractice: React.FC = () => {
  const { addToast } = useNotifications();

  // Mode select state
  const [mode, setMode] = useState<"challenges" | "playground">("challenges");

  // Challenges list states (LeetCode Mode)
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengesLoading, setChallengesLoading] = useState(true);

  // General Editor configurations
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [editorTheme, setEditorTheme] = useState<"dark" | "light">("dark");

  // LeetCode Mode Console & metrics tabs
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    "output" | "evaluation" | "complexity" | "input" | "errors" | "terminal"
  >("output");
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  // Right sidebar tutor assistant state
  const [tutorOutput, setTutorOutput] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  // Layout Panels State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // --- PLAYGROUND MODE STATES ---
  const [playFiles, setPlayFiles] = useState<Record<string, PlayFile>>(() => {
    const saved = localStorage.getItem("studysphere_play_files");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      "main.py": {
        name: "main.py",
        content: "print('Hello')\n",
        language: "python"
      }
    };
  });
  const [activePlayFile, setActivePlayFile] = useState<string>(() => {
    const saved = localStorage.getItem("studysphere_active_play_file");
    return saved && saved in playFiles ? saved : "main.py";
  });
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [playgroundStdin, setPlaygroundStdin] = useState("");
  const [playgroundTerminalLogs, setPlaygroundTerminalLogs] = useState<string[]>([]);
  const [playgroundExecutionResult, setPlaygroundExecutionResult] = useState<any | null>(null);
  const [playgroundFontSize, setPlaygroundFontSize] = useState(15);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Ref to Monaco editor model to apply markers
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const loadChallenges = async () => {
    try {
      const res = await api.get("/api/coding/challenges");
      setChallenges(res.data);
      if (res.data.length > 0) {
        setSelectedChallenge(res.data[0]);
        // Set initial code template
        setCode(res.data[0].template["python"] || "");
      }
    } catch (e) {
      addToast("Error", "Could not load coding challenges.", "error");
    } finally {
      setChallengesLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  // Track code length console logging
  useEffect(() => {
    console.log(`Loaded code buffer length: ${code.length} characters`);
  }, [code]);

  // Load selected playground file code
  useEffect(() => {
    if (mode === "playground" && activePlayFile && playFiles[activePlayFile]) {
      setCode(playFiles[activePlayFile].content);
      const ext = activePlayFile.split(".").pop() || "";
      const mappedLang = mapExtToLang(ext);
      setLanguage(mappedLang);
      localStorage.setItem("studysphere_active_play_file", activePlayFile);
    }
  }, [activePlayFile, mode]);

  // Auto Save mechanism
  useEffect(() => {
    if (mode === "playground" && activePlayFile && playFiles[activePlayFile]) {
      setIsAutoSaving(true);
      const timeoutId = setTimeout(() => {
        setPlayFiles(prev => {
          const next = {
            ...prev,
            [activePlayFile]: { ...prev[activePlayFile], content: code }
          };
          localStorage.setItem("studysphere_play_files", JSON.stringify(next));
          return next;
        });
        setIsAutoSaving(false);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [code, activePlayFile, mode]);

  const mapExtToLang = (ext: string) => {
    const maps: Record<string, string> = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      cpp: "cpp",
      h: "cpp",
      hpp: "cpp",
      c: "c",
      java: "java",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      kt: "kotlin",
      swift: "swift",
      cs: "csharp",
      sql: "sql",
      sh: "bash"
    };
    return maps[ext.toLowerCase()] || "python";
  };

  const handleSelectChallenge = (chall: Challenge) => {
    setSelectedChallenge(chall);
    const template = chall.template[language] || chall.template["python"] || "";
    setCode(template);
    setExecutionResult(null);
    setTutorOutput(null);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (mode === "challenges" && selectedChallenge) {
      setCode(selectedChallenge.template[lang] || "");
    }
  };

  // Upgraded language change for playgrounds
  const handlePlaygroundLanguageChange = (newLang: string) => {
    const ext = langToExt[newLang] || "py";
    
    // Select specific file naming structures matching user instructions
    let baseName = "main";
    if (newLang === "php") baseName = "index";
    else if (newLang === "csharp") baseName = "Program";
    else if (newLang === "bash") baseName = "script";
    else if (newLang === "java" || newLang === "kotlin") baseName = "Main";
    
    const newName = `${baseName}.${ext}`;
    const oldName = activePlayFile;

    const currentContent = code.trim();
    const isDefaultOrEmpty =
      !currentContent ||
      currentContent.includes("print(\"Hello\")") ||
      currentContent.includes("print('Hello')") ||
      currentContent.includes("System.out.print") ||
      currentContent.includes("System.out.println") ||
      currentContent.includes("std::cout") ||
      currentContent.includes("console.log") ||
      currentContent.includes("printf(") ||
      currentContent.includes("echo ") ||
      currentContent.includes("puts ") ||
      currentContent.includes("SELECT ") ||
      currentContent.includes("Hello") ||
      currentContent.includes("def main():");

    const template = playTemplates[newLang] || "";
    const nextContent = isDefaultOrEmpty ? template : code;

    setPlayFiles(prev => {
      const next = { ...prev };
      delete next[oldName];
      next[newName] = { name: newName, content: nextContent, language: newLang };
      localStorage.setItem("studysphere_play_files", JSON.stringify(next));
      return next;
    });

    setActivePlayFile(newName);
    setCode(nextContent);
    setLanguage(newLang);
    addToast("Language Updated", `Switched to ${newLang.toUpperCase()}`, "success");
  };

  const handleResetCode = () => {
    if (mode === "challenges" && selectedChallenge) {
      setCode(selectedChallenge.template[language] || "");
      setExecutionResult(null);
      setTutorOutput(null);
      addToast("Reset Completed", "Boilerplate restored.", "info");
    } else if (mode === "playground" && activePlayFile) {
      const ext = activePlayFile.split(".").pop() || "";
      const lang = mapExtToLang(ext);
      const template = playTemplates[lang] || "";
      setCode(template);
      addToast("Reset Completed", "Starter boilerplate restored.", "info");
    }
  };

  // Run Code logic selector
  const handleRunCodeAction = () => {
    if (mode === "challenges") {
      handleExecuteCode(false);
    } else {
      handleExecutePlayground();
    }
  };

  // Compiler execute trigger (Challenges Mode)
  const handleExecuteCode = async (isSubmit = false) => {
    if (!code.trim() || executionLoading) return;
    setExecutionLoading(true);
    setExecutionResult(null);
    setActiveConsoleTab("output");
    addToast(isSubmit ? "Submitting Solution" : "Executing Code", "Testing cases in safe sandbox container...", "info");

    try {
      const res = await api.post("/api/coding/execute", {
        code,
        language,
        challenge_id: selectedChallenge?.id,
        is_submit: isSubmit,
        mode: "challenges"
      });
      setExecutionResult(res.data);
      if (res.data.success) {
        addToast("Execution Passed", "All unit tests completed successfully!", "success");
      } else {
        addToast("Execution Failed", "Check compilation error details below.", "warning");
      }
    } catch (e: any) {
      const errRes = e.response?.data;
      if (errRes && errRes.stderr) {
        setExecutionResult({
          success: false,
          stdout: "",
          stderr: errRes.stderr,
          readability_score: 0,
          maintainability_score: 0,
          performance_score: 0
        });
        addToast("Error", errRes.stderr, "error");
      } else {
        addToast("Error", "Execution pipeline request failed.", "error");
      }
    } finally {
      setExecutionLoading(false);
    }
  };

  // Free Code Playground Execution trigger
  const handleExecutePlayground = async () => {
    if (executionLoading) return;
    setExecutionLoading(true);
    setPlaygroundTerminalLogs(["Running..."]);
    setPlaygroundExecutionResult(null);
    setActiveConsoleTab("output");
    addToast("Executing Code", "Launching sandboxed runtime compiler...", "info");

    try {
      const fileMap: Record<string, string> = {};
      Object.keys(playFiles).forEach(k => {
        fileMap[k] = playFiles[k].content;
      });
      // Force latest unsaved code to active file entry to avoid 500ms debounce mismatch
      fileMap[activePlayFile] = code;

      const res = await api.post("/api/coding/execute", {
        mode: "playground",
        code,
        language: mapExtToLang(activePlayFile.split(".").pop() || ""),
        stdin: playgroundStdin,
        files: fileMap,
        entry_point: activePlayFile
      });

      setPlaygroundExecutionResult(res.data);
      if (res.data.success) {
        setPlaygroundTerminalLogs([
          "Running...",
          "Program Finished Successfully",
          `Exit Code: ${res.data.exit_code || 0}`
        ]);
        addToast("Execution Passed", "Program finished successfully!", "success");
      } else {
        setPlaygroundTerminalLogs([
          "Running...",
          "Program Finished with Errors",
          `Exit Code: ${res.data.exit_code || 1}`
        ]);
        addToast("Execution Failed", "Process exited with errors. Check Errors List tab.", "warning");
      }
    } catch (e: any) {
      const errRes = e.response?.data;
      setPlaygroundTerminalLogs(["Running...", "Execution pipeline failed."]);
      setPlaygroundExecutionResult({
        success: false,
        stdout: "",
        stderr: errRes?.stderr || "Request timed out or offline.",
        exit_code: -1
      });
      addToast("Error", "Sandbox execution failed.", "error");
    } finally {
      setExecutionLoading(false);
    }
  };

  // AI assistant helpers
  const handleTutorAction = async (action: string) => {
    if (!code.trim() || tutorLoading) return;
    setTutorLoading(true);
    setTutorOutput(null);
    setShowAIPanel(true);
    addToast("Invoking AI Advisor", "AI inspecting algorithm bounds...", "info");

    try {
      const res = await api.post("/api/coding/assistant", {
        action,
        code,
        language
      });
      setTutorOutput(res.data.result);
      addToast("Tutor Advice Ready", "Recommendations compiled.", "success");
    } catch (e) {
      addToast("Failed", "AI assistant request failed.", "error");
    } finally {
      setTutorLoading(false);
    }
  };

  // Highlight error lines inside Monaco Editor on compile failure
  useEffect(() => {
    const currentResult = mode === "challenges" ? executionResult : playgroundExecutionResult;
    if (currentResult && currentResult.stderr && editorRef.current && monacoRef.current) {
      const stderr = currentResult.stderr;
      const match = stderr.match(/Line (\d+)/i);
      if (match) {
        const lineNum = parseInt(match[1]);
        const model = editorRef.current.getModel();
        if (model && lineNum > 0 && lineNum <= model.getLineCount()) {
          const errMsg = stderr.split("\n")[1] || "Error at compile or runtime execution.";
          monacoRef.current.editor.setModelMarkers(model, "compiler", [
            {
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: model.getLineLength(lineNum) + 1,
              message: errMsg,
              severity: monacoRef.current.MarkerSeverity.Error
            }
          ]);
        }
      }
    } else if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, "compiler", []);
      }
    }
  }, [executionResult, playgroundExecutionResult, mode]);

  // Playground File Explorer operations
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    if (playFiles[name]) {
      addToast("File Exists", "A file with this name already exists.", "warning");
      return;
    }
    const ext = name.split(".").pop() || "";
    const lang = mapExtToLang(ext);

    setPlayFiles(prev => {
      const next = {
        ...prev,
        [name]: { name, content: "", language: lang }
      };
      localStorage.setItem("studysphere_play_files", JSON.stringify(next));
      return next;
    });
    setActivePlayFile(name);
    setNewFileName("");
    setIsCreatingFile(false);
    addToast("File Created", `Created file ${name} successfully.`, "success");
  };

  const handleDeleteFile = (fname: string) => {
    if (Object.keys(playFiles).length <= 1) {
      addToast("Cannot Delete", "The playground must have at least one file.", "warning");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete ${fname}?`);
    if (!confirmed) return;

    setPlayFiles(prev => {
      const next = { ...prev };
      delete next[fname];
      localStorage.setItem("studysphere_play_files", JSON.stringify(next));
      return next;
    });

    if (activePlayFile === fname) {
      const remaining = Object.keys(playFiles).filter(f => f !== fname);
      setActivePlayFile(remaining[0]);
    }
    addToast("File Deleted", `${fname} removed from workspace.`, "info");
  };

  const handleRenameFile = (oldName: string) => {
    const newName = window.prompt(`Rename ${oldName} to:`, oldName);
    if (!newName || !newName.trim() || newName === oldName) return;
    const name = newName.trim();
    if (playFiles[name]) {
      addToast("File Exists", "A file with this name already exists.", "warning");
      return;
    }
    const ext = name.split(".").pop() || "";
    const lang = mapExtToLang(ext);

    setPlayFiles(prev => {
      const next = { ...prev };
      const content = next[oldName].content;
      delete next[oldName];
      next[name] = { name, content, language: lang };
      localStorage.setItem("studysphere_play_files", JSON.stringify(next));
      return next;
    });

    if (activePlayFile === oldName) {
      setActivePlayFile(name);
    }
    addToast("File Renamed", `Renamed to ${name}`, "success");
  };

  // Keyboard Shortcuts registration on Monaco Mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Run (Ctrl + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCodeAction();
    });

    // Save (Ctrl + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      addToast("Auto Saved", "Files preserved in browser memory cache.", "info");
    });
  };

  const handleEditorWillMount = (monaco: any) => {
    // Register custom dark theme matching premium SaaS design
    monaco.editor.defineTheme("studysphere-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "A855F7" },
        { token: "function", foreground: "3B82F6" },
        { token: "string", foreground: "10B981" },
        { token: "number", foreground: "F59E0B" },
        { token: "variable", foreground: "E2E8F0" }
      ],
      colors: {
        "editor.background": "#0a0a12",
        "editor.foreground": "#E2E8F0",
        "editorLineNumber.foreground": "#64748B",
        "editorCursor.foreground": "#8B5CF6",
        "editor.selectionBackground": "#8B5CF640",
        "editor.lineHighlightBackground": "#161625"
      }
    });

    monaco.editor.defineTheme("studysphere-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "8B5CF6", fontStyle: "bold" },
        { token: "function", foreground: "3B82F6" },
        { token: "string", foreground: "10B981" },
        { token: "number", foreground: "F59E0B" },
        { token: "variable", foreground: "0f0f1a" }
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#0f0f1a",
        "editorLineNumber.foreground": "#94A3B8",
        "editorCursor.foreground": "#8B5CF6",
        "editor.selectionBackground": "#E2E8F0",
        "editor.lineHighlightBackground": "#F8FAFC"
      }
    });
  };

  const renderInlineText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const inlineCodeRegex = /`(.*?)`/g;
    
    let parts: any[] = [{ type: 'text', content: text }];
    
    parts = parts.flatMap(p => {
      if (p.type !== 'text') return p;
      const subparts = p.content.split(boldRegex);
      return subparts.map((sp: string, i: number) => {
        if (i % 2 === 1) return { type: 'bold', content: sp };
        return { type: 'text', content: sp };
      });
    });
    
    parts = parts.flatMap(p => {
      if (p.type !== 'text') return p;
      const subparts = p.content.split(inlineCodeRegex);
      return subparts.map((sp: string, i: number) => {
        if (i % 2 === 1) return { type: 'inline-code', content: sp };
        return { type: 'text', content: sp };
      });
    });
    
    return parts.map((p, i) => {
      if (p.type === 'bold') {
        return <strong key={i} className="font-bold text-white">{p.content}</strong>;
      }
      if (p.type === 'inline-code') {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-xs text-purple-400 font-semibold">{p.content}</code>;
      }
      return p.content;
    });
  };

  const renderTutorMarkdown = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith("```")) {
        const matches = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = matches ? matches[1] : "";
        const codeText = matches ? matches[2] : part.slice(3, -3);
        
        return (
          <div key={idx} className="my-4 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0a0a12] shadow-sm select-text">
            <div className="flex justify-between items-center bg-[#161625] px-4 py-2 border-b border-white/[0.06] text-xs font-semibold text-purple-400 select-none">
              <span className="uppercase">{lang || "code"}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeText);
                  addToast("Copied", "Code snippet copied to clipboard.", "success");
                }}
                className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      
      const paragraphs = part.split("\n").filter(p => p.trim() !== "");
      return paragraphs.map((para, pIdx) => {
        let cleanPara = para.trim();
        
        if (cleanPara.startsWith("- ") || cleanPara.startsWith("* ")) {
          const listText = cleanPara.substring(2);
          return (
            <ul key={`${idx}-${pIdx}`} className="list-disc pl-5 text-sm text-slate-400 my-1.5 leading-relaxed select-text">
              <li>{renderInlineText(listText)}</li>
            </ul>
          );
        }
        
        if (cleanPara.startsWith("### ")) {
          return (
            <h5 key={`${idx}-${pIdx}`} className="text-sm font-bold text-purple-400 mt-5 mb-2 tracking-wide select-text">
              {cleanPara.replace("### ", "")}
            </h5>
          );
        }
        if (cleanPara.startsWith("## ")) {
          return (
            <h4 key={`${idx}-${pIdx}`} className="text-base font-bold text-white mt-6 mb-3 select-text">
              {cleanPara.replace("## ", "")}
            </h4>
          );
        }
        if (cleanPara.startsWith("# ")) {
          return (
            <h3 key={`${idx}-${pIdx}`} className="text-lg font-bold text-white mt-8 mb-4 select-text">
              {cleanPara.replace("# ", "")}
            </h3>
          );
        }
        
        return (
          <p key={`${idx}-${pIdx}`} className="text-sm text-slate-400 my-2.5 leading-relaxed select-text">
            {renderInlineText(cleanPara)}
          </p>
        );
      });
    });
  };

  const activeResult = mode === "challenges" ? executionResult : playgroundExecutionResult;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0a0a12] text-white overflow-hidden font-sans w-full">
      {/* TOP TOOLBAR */}
      <div className="bg-[#0c0c16] border-b border-white/[0.04] px-4 py-3 flex flex-wrap gap-3 items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Toggle Sidebar"
          >
            {showLeftPanel ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none cursor-pointer"
          >
            <option value="challenges">Challenges</option>
            <option value="playground">Playground</option>
          </select>
          
          {mode === "challenges" ? (
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none cursor-pointer"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
            </select>
          ) : (
            <select
              value={language}
              onChange={(e) => handlePlaygroundLanguageChange(e.target.value)}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none cursor-pointer"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="kotlin">Kotlin</option>
              <option value="swift">Swift</option>
              <option value="csharp">C#</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
            </select>
          )}
        </div>

        <div className="flex-1 text-center truncate px-4 hidden md:block">
          {mode === "challenges" && selectedChallenge && (
            <span className="font-semibold text-white">{selectedChallenge.title}</span>
          )}
          {mode === "playground" && (
            <span className="text-sm text-slate-400 flex items-center justify-center gap-2">
              <Keyboard className="w-4 h-4" /> Ctrl+Enter to Run
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2 hover:bg-white/[0.08] flex items-center gap-2 text-sm transition-colors ${showAIPanel ? 'text-purple-400 border-purple-500/30' : 'text-white'}`}
          >
            <Sparkles className="w-4 h-4" /> AI Assistant
          </button>
          <button
            onClick={handleResetCode}
            className="bg-white/[0.05] border border-white/[0.08] text-white rounded-xl px-4 py-2 hover:bg-white/[0.08] flex items-center gap-2 text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleRunCodeAction}
            disabled={executionLoading || (!code.trim() && mode === "challenges")}
            className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl px-6 py-2 font-semibold transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {executionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
          </button>
          {mode === "challenges" && (
            <button
              onClick={() => handleExecuteCode(true)}
              disabled={executionLoading || !code.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 py-2 font-semibold transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      </div>

      {/* MAIN SPLIT LAYOUT */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
        
        {/* LEFT PANEL: Challenges or Explorer */}
        {showLeftPanel && (
          <div className="w-full lg:w-[280px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-[#0c0c16] flex flex-col h-[250px] lg:h-full z-10">
            {mode === "challenges" ? (
              <>
                <div className="px-5 py-4 border-b border-white/[0.06] shrink-0">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Problems
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {challengesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    challenges.map(chall => {
                      const isActive = chall.id === selectedChallenge?.id;
                      const difficultyColors = {
                        Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        Hard: "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      };
                      return (
                        <div
                          key={chall.id}
                          onClick={() => handleSelectChallenge(chall)}
                          className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                            isActive
                              ? "bg-[#161625] border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                              : "bg-transparent border-transparent hover:bg-white/[0.02]"
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-white mb-2">{chall.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[chall.difficulty]}`}>
                              {chall.difficulty}
                            </span>
                            <span className="text-xs text-slate-500">{chall.category}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-white/[0.06] shrink-0 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" /> Explorer
                  </h3>
                  <button
                    onClick={() => setIsCreatingFile(!isCreatingFile)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {isCreatingFile && (
                  <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] space-y-3">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="e.g. main.py"
                      className="w-full bg-[#0a0a12] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCreateFile} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-1.5 text-sm font-medium transition-colors">
                        Create
                      </button>
                      <button onClick={() => setIsCreatingFile(false)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg py-1.5 text-sm font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {Object.keys(playFiles).map(fname => {
                    const isActive = activePlayFile === fname;
                    return (
                      <div
                        key={fname}
                        onClick={() => setActivePlayFile(fname)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-[#161625] text-white"
                            : "text-slate-400 hover:bg-white/[0.02] hover:text-white"
                        }`}
                      >
                        <span className="text-sm flex items-center gap-2 truncate">
                          <FileCode className={`w-4 h-4 ${isActive ? 'text-purple-400' : ''}`} /> {fname}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleRenameFile(fname); }} className="p-1 rounded hover:bg-white/[0.1]">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(fname); }} className="p-1 rounded hover:bg-white/[0.1] text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a12] border-b lg:border-b-0 lg:border-r border-white/[0.06]">
          <div className="bg-[#161625] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                {mode === "playground" ? activePlayFile : `main.${langToExt[language] || 'py'}`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {mode === "playground" && (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  {isAutoSaving ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                  ) : (
                    "● Auto-saved"
                  )}
                </span>
              )}
              <button
                onClick={() => setEditorTheme(editorTheme === "dark" ? "light" : "dark")}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                {editorTheme === "dark" ? "Light Theme" : "Dark Theme"}
              </button>
            </div>
          </div>

          {mode === "challenges" && selectedChallenge && (
            <div className="p-4 bg-[#0c0c16] border-b border-white/[0.06] shrink-0">
              <h3 className="text-base font-bold text-white mb-2">{selectedChallenge.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{selectedChallenge.desc}</p>
            </div>
          )}

          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={
                language === "cpp" ? "cpp" :
                language === "c" ? "c" :
                language === "java" ? "java" :
                language === "go" ? "go" :
                language === "rust" ? "rust" :
                language === "php" ? "php" :
                language === "ruby" ? "ruby" :
                language === "kotlin" ? "kotlin" :
                language === "swift" ? "swift" :
                language === "csharp" ? "csharp" :
                language === "sql" ? "sql" :
                language === "bash" ? "shell" :
                language === "javascript" ? "javascript" :
                language === "typescript" ? "typescript" : "python"
              }
              theme={editorTheme === "dark" ? "studysphere-dark" : "studysphere-light"}
              value={code}
              onChange={(val) => setCode(val || "")}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              options={{
                fontFamily: "JetBrains Mono, Consolas, Fira Code, monospace",
                fontSize: mode === "playground" ? playgroundFontSize : 15,
                minimap: { enabled: false },
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                cursorBlinking: "blink",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: "all",
                automaticLayout: true
              }}
            />
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col bg-[#0a0a12] h-[300px] lg:h-full">
          <div className="flex overflow-x-auto border-b border-white/[0.06] bg-[#0c0c16] shrink-0 scrollbar-hide">
            {(mode === "challenges" 
              ? [
                  { id: "output", label: "Output", icon: <Terminal className="w-4 h-4" /> },
                  { id: "evaluation", label: "Review", icon: <Gauge className="w-4 h-4" /> },
                  { id: "complexity", label: "Complexity", icon: <Activity className="w-4 h-4" /> }
                ]
              : [
                  { id: "output", label: "Output", icon: <Terminal className="w-4 h-4" /> },
                  { id: "input", label: "Input", icon: <Keyboard className="w-4 h-4" /> },
                  { id: "errors", label: "Errors", icon: <AlertTriangle className="w-4 h-4" /> },
                  { id: "terminal", label: "Logs", icon: <Cpu className="w-4 h-4" /> }
                ]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveConsoleTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeConsoleTab === tab.id
                    ? "border-purple-500 text-white bg-white/[0.02]"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 font-mono text-sm bg-[#0a0a12]">
            {executionLoading && activeConsoleTab !== "input" ? (
              <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" /> Executing...
              </div>
            ) : (
              <>
                {activeConsoleTab === "output" && (
                  <div className="space-y-4">
                    {mode === "challenges" && activeResult?.stderr ? (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 block">Runtime Error</span>
                        <pre className="text-rose-400 text-sm whitespace-pre-wrap">{activeResult.stderr}</pre>
                      </div>
                    ) : activeResult ? (
                      <div className="bg-[#161625] border border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="flex justify-between items-center bg-white/[0.02] px-4 py-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2">
                            {activeResult.success ? (
                              <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-medium">
                                <CheckCircle className="w-4 h-4" /> Success
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1.5 text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" /> Failed
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-xs">Exit Code: {activeResult.exit_code || (activeResult.success ? 0 : 1)}</span>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-2">Stdout</span>
                            <pre className="text-slate-300 whitespace-pre-wrap">{activeResult.stdout || "No output"}</pre>
                          </div>
                          {activeResult.stderr && (
                            <div className="pt-4 border-t border-white/[0.06]">
                              <span className="text-xs text-rose-500 uppercase tracking-wider font-semibold block mb-2">Stderr</span>
                              <pre className="text-rose-400 whitespace-pre-wrap">{activeResult.stderr}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic text-center py-8">Run your code to see the output here.</div>
                    )}
                  </div>
                )}

                {activeConsoleTab === "input" && (
                  <div className="h-full flex flex-col">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
                      Standard Input (stdin)
                    </label>
                    <textarea
                      value={playgroundStdin}
                      onChange={(e) => setPlaygroundStdin(e.target.value)}
                      placeholder="Type standard input here..."
                      className="flex-1 bg-[#161625] border border-white/[0.06] rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-purple-500/50 resize-none font-mono"
                    />
                  </div>
                )}

                {activeConsoleTab === "evaluation" && (
                  <div className="space-y-4">
                    {activeResult ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#161625] border border-white/[0.06] rounded-xl p-4">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Time</span>
                            <span className="text-lg font-bold text-purple-400">{activeResult.execution_time || "15 ms"}</span>
                          </div>
                          <div className="bg-[#161625] border border-white/[0.06] rounded-xl p-4">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Memory</span>
                            <span className="text-lg font-bold text-purple-400">{activeResult.memory || "16 MB"}</span>
                          </div>
                        </div>
                        <div className="bg-[#161625] border border-white/[0.06] rounded-xl p-4 text-slate-400 font-sans">
                          {mode === "challenges" ? activeResult.security_review : "Program completed in secure sandbox."}
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500 italic text-center py-8">Run your code first.</div>
                    )}
                  </div>
                )}

                {activeConsoleTab === "errors" && (
                  <div>
                    {activeResult?.stderr ? (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                        <span className="text-xs text-rose-400 uppercase tracking-wider font-semibold block mb-2">Stack Trace</span>
                        <pre className="text-rose-400 whitespace-pre-wrap">{activeResult.stderr}</pre>
                      </div>
                    ) : (
                      <div className="text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> No errors detected.
                      </div>
                    )}
                  </div>
                )}

                {activeConsoleTab === "complexity" && (
                  <div className="space-y-4 font-sans">
                    <div className="bg-[#161625] border border-white/[0.06] rounded-xl p-4">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Time Complexity</span>
                      <span className="text-lg font-mono font-bold text-purple-400">
                        {activeResult?.complexity_analysis?.time_complexity || "O(1)"}
                      </span>
                    </div>
                    <div className="bg-[#161625] border border-white/[0.06] rounded-xl p-4">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">Space Complexity</span>
                      <span className="text-lg font-mono font-bold text-purple-400">
                        {activeResult?.complexity_analysis?.space_complexity || "O(1)"}
                      </span>
                    </div>
                  </div>
                )}

                {activeConsoleTab === "terminal" && (
                  <div className="space-y-2">
                    {playgroundTerminalLogs.length === 0 ? (
                      <div className="text-slate-500 italic">No terminal logs.</div>
                    ) : (
                      playgroundTerminalLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-slate-300">
                          <span className="text-purple-500 font-bold">$</span>
                          <span>{log}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* AI ASSISTANT OVERLAY PANEL */}
        {showAIPanel && (
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[350px] bg-[#0c0c16] border-l border-white/[0.06] shadow-2xl z-20 flex flex-col">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0c0c16]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> AI Assistant
              </h3>
              <button onClick={() => setShowAIPanel(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-white/[0.06] bg-[#0a0a12] shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {(mode === "challenges" 
                  ? [
                      { id: "explain", label: "Explain Code" },
                      { id: "optimize", label: "Optimize" },
                      { id: "debug", label: "Debug" },
                      { id: "convert", label: "Convert JS" }
                    ]
                  : [
                      { id: "explain", label: "Explain" },
                      { id: "debug", label: "Debug" },
                      { id: "optimize", label: "Optimize" },
                      { id: "generate", label: "Generate" },
                      { id: "comments", label: "Comments" },
                      { id: "testcases", label: "Tests" }
                    ]
                ).map(act => (
                  <button
                    key={act.id}
                    onClick={() => handleTutorAction(act.id)}
                    disabled={tutorLoading || !code.trim()}
                    className="bg-[#161625] hover:bg-white/[0.05] border border-white/[0.06] text-slate-300 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tutorLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm">Analyzing code...</p>
                </div>
              ) : tutorOutput ? (
                <div className="space-y-4">
                  {renderTutorMarkdown(tutorOutput)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                  <BookOpen className="w-12 h-12 text-slate-500" />
                  <div>
                    <h5 className="font-semibold text-white mb-2">AI Ready</h5>
                    <p className="text-sm text-slate-400">Select an action above to get AI assistance with your code.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
