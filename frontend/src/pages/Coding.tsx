import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import Editor from "@monaco-editor/react";
import {
  Code,
  Play,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  BookOpen,
  Info,
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
  Settings,
  HelpCircle,
  FileText
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
    // Register custom dark theme
    monaco.editor.defineTheme("studysphere-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "C084FC" },
        { token: "function", foreground: "60A5FA" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "FBBF24" },
        { token: "variable", foreground: "E5E7EB" }
      ],
      colors: {
        "editor.background": "#09090B",
        "editor.foreground": "#E5E7EB",
        "editorLineNumber.foreground": "#4C566A",
        "editorCursor.foreground": "#EC4899",
        "editor.selectionBackground": "#3B4252",
        "editor.lineHighlightBackground": "#111827"
      }
    });

    // Register custom light theme
    monaco.editor.defineTheme("studysphere-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "7C3AED", fontStyle: "bold" },
        { token: "function", foreground: "2563EB" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "D97706" },
        { token: "variable", foreground: "1F2937" }
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#1F2937",
        "editorLineNumber.foreground": "#9CA3AF",
        "editorCursor.foreground": "#7C3AED",
        "editor.selectionBackground": "#E5E7EB",
        "editor.lineHighlightBackground": "#F3F4F6"
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
        return <strong key={i} className="font-extrabold text-white">{p.content}</strong>;
      }
      if (p.type === 'inline-code') {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 font-mono text-[9px] text-amber-500 font-semibold">{p.content}</code>;
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
          <div key={idx} className="my-3 rounded-xl overflow-hidden border border-white/5 bg-[#181922] shadow-inner select-text">
            <div className="flex justify-between items-center bg-[#11121a] px-3.5 py-1.5 border-b border-white/5 text-[9px] font-black uppercase text-indigo-400 select-none">
              <span>{lang || "code"}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeText);
                  addToast("Copied", "Code snippet copied to clipboard.", "success");
                }}
                className="hover:text-white cursor-pointer transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="p-3 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
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
            <ul key={`${idx}-${pIdx}`} className="list-disc pl-4 text-[10px] text-slate-350 my-1 leading-relaxed select-text">
              <li>{renderInlineText(listText)}</li>
            </ul>
          );
        }
        
        if (cleanPara.startsWith("- [ ]") || cleanPara.startsWith("- [x]")) {
          const checked = cleanPara.startsWith("- [x]");
          const listText = cleanPara.substring(5);
          return (
            <div key={`${idx}-${pIdx}`} className="flex items-start gap-2 text-[10px] text-slate-350 my-1 leading-relaxed select-text">
              <input type="checkbox" checked={checked} readOnly className="w-3.5 h-3.5 rounded border-white/5 bg-slate-900" />
              <span>{renderInlineText(listText)}</span>
            </div>
          );
        }
        
        if (cleanPara.startsWith("### ")) {
          return (
            <h5 key={`${idx}-${pIdx}`} className="text-[10px] font-black text-indigo-400 uppercase mt-4 mb-1.5 tracking-wider select-text">
              {cleanPara.replace("### ", "")}
            </h5>
          );
        }
        if (cleanPara.startsWith("## ")) {
          return (
            <h4 key={`${idx}-${pIdx}`} className="text-xs font-black text-white mt-5 mb-2 border-b border-white/5 pb-1 select-text">
              {cleanPara.replace("## ", "")}
            </h4>
          );
        }
        if (cleanPara.startsWith("# ")) {
          return (
            <h3 key={`${idx}-${pIdx}`} className="text-sm font-black text-white mt-6 mb-3 select-text">
              {cleanPara.replace("# ", "")}
            </h3>
          );
        }
        
        if (cleanPara.startsWith("> ")) {
          return (
            <blockquote key={`${idx}-${pIdx}`} className="border-l-2 border-indigo-500 pl-3 py-1 my-2 bg-indigo-500/5 text-[9.5px] italic text-indigo-200 select-text">
              {renderInlineText(cleanPara.substring(2))}
            </blockquote>
          );
        }
        
        if (cleanPara.startsWith("|") && cleanPara.endsWith("|")) {
          const cells = cleanPara.split("|").slice(1, -1).map(c => c.trim());
          if (cells.every(c => c.startsWith("-"))) return null;
          return (
            <div key={`${idx}-${pIdx}`} className="overflow-x-auto my-2 select-text">
              <table className="min-w-full divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden text-[9px]">
                <tbody>
                  <tr className="bg-[#181922]">
                    {cells.map((c, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-1.5 font-semibold text-slate-300 border-r border-white/5 last:border-0">{renderInlineText(c)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }
        
        return (
          <p key={`${idx}-${pIdx}`} className="text-[10.5px] text-slate-350 my-1.5 leading-relaxed select-text">
            {renderInlineText(cleanPara)}
          </p>
        );
      });
    });
  };

  const activeResult = mode === "challenges" ? executionResult : playgroundExecutionResult;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] border border-white/5 bg-[#12131A] rounded-3xl overflow-hidden shadow-xl w-full">
      {/* MODE TABS SWITCHER */}
      <div className="flex border-b border-slate-200/50 dark:border-slate-850 bg-slate-55/20 dark:bg-slate-950/20 px-6 py-2.5 gap-4 flex-shrink-0 select-none items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setMode("challenges")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === "challenges"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Coding Challenges
          </button>
          <button
            onClick={() => setMode("playground")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === "playground"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Code Playground
          </button>
        </div>

        {mode === "playground" && (
          <span className="text-[9.5px] text-indigo-400 flex items-center gap-1.5 font-bold uppercase select-none animate-pulse">
            <Keyboard className="w-4 h-4" /> Ctrl+Enter to Run
          </span>
        )}
      </div>

      <div className="flex flex-grow overflow-hidden w-full">
        {/* 1. LEFT SIDEBAR: Challenges or File Explorer */}
        <div className="w-[260px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#11121A] overflow-hidden select-none">
          {mode === "challenges" ? (
            <>
              <div className="p-3.5 border-b border-slate-200/50 dark:border-slate-855 bg-slate-55/20 flex-shrink-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-550" /> Coding Challenges
                </span>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {challengesLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  challenges.map(chall => {
                    const isActive = chall.id === selectedChallenge?.id;
                    const difficultyColors = {
                      Easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/15",
                      Medium: "bg-amber-500/10 text-amber-500 border-amber-500/15",
                      Hard: "bg-rose-500/10 text-rose-500 border-rose-500/15"
                    };
                    return (
                      <div
                        key={chall.id}
                        onClick={() => handleSelectChallenge(chall)}
                        className={`p-3 rounded-xl cursor-pointer border transition-all ${
                          isActive
                            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                            : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                        }`}
                      >
                        <h4 className="text-[10px] font-bold text-slate-800 dark:text-white truncate">
                          {chall.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              difficultyColors[chall.difficulty]
                            }`}
                          >
                            {chall.difficulty}
                          </span>
                          <span className="text-[8px] text-slate-450 uppercase">{chall.category}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              {/* VS Code style File Explorer */}
              <div className="p-3 border-b border-slate-200/50 dark:border-slate-850 bg-slate-50/20 flex-shrink-0 flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-500" /> Workspace Explorer
                </span>
                <button
                  onClick={() => setIsCreatingFile(!isCreatingFile)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-400 cursor-pointer"
                  title="New File"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreatingFile && (
                <div className="p-3 border-b border-slate-200/50 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/30 space-y-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="e.g. main.py, utils.js"
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateFile}
                      className="px-3 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setIsCreatingFile(false)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-650 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {Object.keys(playFiles).map(fname => {
                  const isActive = activePlayFile === fname;
                  return (
                    <div
                      key={fname}
                      onClick={() => setActivePlayFile(fname)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                        isActive
                          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                          : "border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-850/30"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" /> {fname}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameFile(fname);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Rename"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(fname);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-455 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 2. CENTER PANEL: IDE Source Code Editor & Console tabs */}
        <div className="flex-grow flex flex-col min-w-0 bg-slate-950">
          {/* Editor controls bar */}
          <div className="px-6 py-2.5 border-b border-slate-850 bg-slate-900 flex justify-between items-center flex-shrink-0 select-none">
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" /> Source Workspace
              </span>

              {mode === "challenges" ? (
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="p-1 border border-slate-800 bg-slate-950 text-slate-300 rounded text-[9px] font-bold uppercase outline-none cursor-pointer"
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
                  className="p-1 border border-slate-800 bg-slate-950 text-slate-300 rounded text-[9px] font-bold uppercase outline-none cursor-pointer"
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

            <div className="flex items-center gap-2.5">
              {mode === "playground" && (
                <>
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                    <span className="text-[8px] text-slate-450 uppercase font-sans px-1">Size</span>
                    <select
                      value={playgroundFontSize}
                      onChange={(e) => setPlaygroundFontSize(parseInt(e.target.value))}
                      className="bg-transparent border-none outline-none text-slate-300 text-[9px] font-bold"
                    >
                      {[12, 13, 14, 15, 16, 18, 20].map(sz => (
                        <option key={sz} value={sz}>{sz}px</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[8.5px] font-bold text-slate-500 flex items-center gap-1 uppercase select-none">
                    {isAutoSaving ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving...</span>
                    ) : (
                      "● Auto Saved"
                    )}
                  </span>
                </>
              )}
              <button
                onClick={handleResetCode}
                className="p-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
              <button
                onClick={() => setEditorTheme(editorTheme === "dark" ? "light" : "dark")}
                className="p-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
              >
                {editorTheme === "dark" ? "Light Theme" : "Dark Theme"}
              </button>
            </div>
          </div>

          {/* Selected Challenge description info */}
          {mode === "challenges" && selectedChallenge && (
            <div className="p-4 bg-slate-900 border-b border-slate-850 select-text flex-shrink-0">
              <h3 className="text-xs font-black text-white">{selectedChallenge.title}</h3>
              <p className="text-[10px] text-slate-455 mt-1 leading-relaxed">{selectedChallenge.desc}</p>
            </div>
          )}

          {/* Monaco Editor Area */}
          <div className="flex-grow relative overflow-hidden flex">
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
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: "all",
                automaticLayout: true
              }}
            />
          </div>

          {/* BOTTOM Console Output (Heights 220px) */}
          <div className="h-[230px] border-t border-slate-850 bg-slate-900 flex flex-col flex-shrink-0 overflow-hidden">
            {/* Console tabs selectors */}
            <div className="flex border-b border-slate-850 bg-slate-900 text-[9px] font-extrabold uppercase select-none flex-shrink-0">
              {mode === "challenges" ? (
                [
                  { id: "output", label: "Console Output", icon: <Terminal className="w-3 h-3" /> },
                  { id: "evaluation", label: "AI Code Review", icon: <Gauge className="w-3 h-3" /> },
                  { id: "complexity", label: "Complexity", icon: <Activity className="w-3 h-3" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveConsoleTab(tab.id as any)}
                    className={`flex items-center gap-1 px-4 py-2.5 border-r border-slate-850 cursor-pointer transition-all ${
                      activeConsoleTab === tab.id
                        ? "bg-slate-950 text-white font-black"
                        : "text-slate-450 hover:bg-slate-855/50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))
              ) : (
                [
                  { id: "output", label: "Console", icon: <Terminal className="w-3 h-3" /> },
                  { id: "input", label: "Custom Stdin", icon: <Keyboard className="w-3 h-3" /> },
                  { id: "evaluation", label: "Output Panel", icon: <Gauge className="w-3 h-3" /> },
                  { id: "errors", label: "Errors List", icon: <AlertTriangle className="w-3 h-3" /> },
                  { id: "complexity", label: "AI Complexity", icon: <Activity className="w-3 h-3" /> },
                  { id: "terminal", label: "Terminal logs", icon: <Cpu className="w-3 h-3" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveConsoleTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 border-r border-slate-850 cursor-pointer transition-all ${
                      activeConsoleTab === tab.id
                        ? "bg-slate-950 text-white font-black"
                        : "text-slate-450 hover:bg-slate-850/50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))
              )}

              {/* Run solutions actions */}
              <div className="ml-auto flex items-center gap-2 px-3">
                <button
                  onClick={handleRunCodeAction}
                  disabled={executionLoading || (!code.trim() && mode === "challenges")}
                  className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  {executionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run Code
                </button>
                {mode === "challenges" && (
                  <button
                    onClick={() => handleExecuteCode(true)}
                    disabled={executionLoading || !code.trim()}
                    className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Submit Solution
                  </button>
                )}
              </div>
            </div>

            {/* Console panel content scroll */}
            <div className="flex-grow overflow-y-auto p-4 font-mono text-[9.5px] leading-relaxed text-slate-300 bg-slate-950/40 select-text">
              {executionLoading && activeConsoleTab !== "input" ? (
                <div className="h-full flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling program structures...
                </div>
              ) : (
                <>
                  {/* TAB content 1: Stdout Console */}
                  {activeConsoleTab === "output" && (
                    <div className="space-y-2 select-text font-mono">
                      {mode === "challenges" && activeResult?.stderr ? (
                        <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                          <span className="text-[9px] font-black text-rose-500 uppercase block mb-1">Runtime Exception</span>
                          <pre className="text-rose-500 text-[10px] whitespace-pre-wrap leading-relaxed">{activeResult.stderr}</pre>
                        </div>
                      ) : activeResult ? (
                        <div className="p-3.5 bg-[#181922] border border-white/5 rounded-2xl space-y-3 shadow-inner">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[9px] font-bold uppercase select-none">
                            <div className="flex items-center gap-1.5">
                              {activeResult.success ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Process Completed
                                </span>
                              ) : (
                                <span className="text-rose-450 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Process Terminated
                                </span>
                              )}
                            </div>
                            <span className="text-slate-550 font-mono">Exit Code: {activeResult.exit_code || (activeResult.success ? 0 : 1)}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block select-none">Standard Output (stdout)</span>
                            <pre className="text-slate-100 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">{activeResult.stdout || "(no output printed)"}</pre>
                          </div>

                          {activeResult.stderr && (
                            <div className="space-y-1 pt-2 border-t border-white/5">
                              <span className="text-[8px] text-rose-555 font-bold uppercase block select-none">Standard Error (stderr)</span>
                              <pre className="text-rose-400 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">{activeResult.stderr}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic py-6 select-none flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-slate-550 animate-pulse" />
                          <span>No execution logs. Click Run Code above to inspect outputs.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB content 2: Stdin Input Panel */}
                  {activeConsoleTab === "input" && (
                    <div className="h-full flex flex-col gap-2">
                      <label className="text-[8.5px] text-slate-450 uppercase font-sans font-bold">
                        Provide Standard Input (stdin) parameters:
                      </label>
                      <textarea
                        value={playgroundStdin}
                        onChange={(e) => setPlaygroundStdin(e.target.value)}
                        placeholder="Provide stdin inputs for your program here..."
                        className="flex-grow p-3 bg-slate-900 border border-slate-800 rounded-xl outline-none resize-none text-[10.5px] font-mono text-slate-200"
                      />
                    </div>
                  )}

                  {/* TAB content 3: Output Panel (Stdout metrics) */}
                  {activeConsoleTab === "evaluation" && (
                    <div className="space-y-3">
                      {activeResult ? (
                        <div className="space-y-2">
                          <div className="p-3 border border-slate-800 bg-slate-950/60 rounded-xl space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-sans font-bold">Standard Output</span>
                            <pre className="text-emerald-400 whitespace-pre-wrap">{activeResult.stdout || "(no output printed)"}</pre>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border border-slate-800 bg-slate-950/60 rounded-xl">
                              <span className="text-[8px] text-slate-500 block uppercase font-sans font-bold">Execution Time</span>
                              <span className="text-xs font-black text-indigo-400">{activeResult.execution_time || "15 ms"}</span>
                            </div>
                            <div className="p-3 border border-slate-800 bg-slate-950/60 rounded-xl">
                              <span className="text-[8px] text-slate-500 block uppercase font-sans font-bold">Memory Limit</span>
                              <span className="text-xs font-black text-indigo-400">{activeResult.memory || "16 MB"}</span>
                            </div>
                          </div>
                          <div className="p-3 border border-slate-800 bg-slate-950/60 rounded-xl font-sans text-slate-450 leading-relaxed">
                            {mode === "challenges" ? activeResult.security_review : "Program finished successfully. Output generated from sandboxed virtual runtime."}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-650 italic">Execute code first to inspect output panel details.</div>
                      )}
                    </div>
                  )}

                  {/* TAB content 4: Errors Panel */}
                  {activeConsoleTab === "errors" && (
                    <div className="space-y-2">
                      {activeResult?.stderr ? (
                        <div className="p-3 border border-rose-500/20 bg-rose-500/5 rounded-xl space-y-2">
                          <span className="text-[8px] font-bold text-rose-500 uppercase font-sans">Error stack traces</span>
                          <pre className="text-rose-500 text-[10px] whitespace-pre-wrap">{activeResult.stderr}</pre>
                          <p className="text-[9px] text-slate-455 font-sans mt-2">
                            The editor line causing the compilation or runtime exception is highlighted in red inside the trace stack.
                          </p>
                        </div>
                      ) : (
                        <div className="text-emerald-500 font-bold flex items-center gap-1.5 font-sans">
                          <CheckCircle className="w-4 h-4" /> No compilation or syntax errors detected.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB content 5: Complexity & AI Reviews */}
                  {activeConsoleTab === "complexity" && (
                    <div className="grid grid-cols-2 gap-4 font-sans text-[9px] text-slate-450 p-1">
                      <div className="p-3 border border-slate-800 bg-slate-950 rounded-xl space-y-1">
                        <strong className="text-slate-350 block uppercase text-[8px] font-bold">Estimated Time Complexity</strong>
                        <span className="text-xs font-mono font-black text-indigo-500">
                          {activeResult?.complexity_analysis?.time_complexity || "O(1)"}
                        </span>
                        <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                          Computed from loops, structural recursions, and mapping search footprints.
                        </p>
                      </div>
                      <div className="p-3 border border-slate-800 bg-slate-950 rounded-xl space-y-1">
                        <strong className="text-slate-350 block uppercase text-[8px] font-bold">Space Complexity</strong>
                        <span className="text-xs font-mono font-black text-indigo-500">
                          {activeResult?.complexity_analysis?.space_complexity || "O(1)"}
                        </span>
                        <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                          Assesses runtime parameter space bounds and array allocation mappings.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB content 6: Terminal Panel Logs */}
                  {activeConsoleTab === "terminal" && (
                    <div className="space-y-1">
                      <div className="text-slate-550 border-b border-slate-900 pb-1 mb-2 uppercase text-[8px] font-sans font-bold">
                        Process Stream Terminal Logs
                      </div>
                      {playgroundTerminalLogs.length === 0 ? (
                        <div className="text-slate-650 italic">Terminal stream is inactive.</div>
                      ) : (
                        playgroundTerminalLogs.map((log, idx) => (
                          <div key={idx} className="flex gap-2 items-center text-indigo-400 font-mono text-[9.5px]">
                            <span>&gt;</span>
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
        </div>

        {/* 3. RIGHT SIDEBAR: AI Recruiter Assistant / Playground Actions */}
        <div className="w-[280px] flex-shrink-0 border-l border-white/5 flex flex-col bg-[#11121A] overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/50 dark:border-slate-850 bg-slate-55/20 flex-shrink-0 flex items-center justify-between">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-555" /> AI Coding Advisor
            </span>
          </div>

          {/* AI Helper Actions panel */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-850 grid grid-cols-2 gap-1.5 flex-shrink-0 select-none">
            {mode === "challenges" ? (
              [
                { id: "explain", label: "Explain Code" },
                { id: "optimize", label: "Optimize Big-O" },
                { id: "debug", label: "Fix Errors" },
                { id: "convert", label: "Convert JS" }
              ].map(act => (
                <button
                  key={act.id}
                  onClick={() => handleTutorAction(act.id)}
                  disabled={tutorLoading || !code.trim()}
                  className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-350 cursor-pointer disabled:opacity-50"
                >
                  {act.label}
                </button>
              ))
            ) : (
              [
                { id: "explain", label: "Explain Code" },
                { id: "debug", label: "Fix Errors" },
                { id: "optimize", label: "Optimize Code" },
                { id: "generate", label: "Generate Code" },
                { id: "comments", label: "Add Comments" },
                { id: "convert", label: "Convert Language" },
                { id: "complexity", label: "Complexity" },
                { id: "testcases", label: "Test Cases" },
                { id: "documentation", label: "Generate Docs" }
              ].map(act => (
                <button
                  key={act.id}
                  onClick={() => handleTutorAction(act.id)}
                  disabled={tutorLoading || !code.trim()}
                  className="py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-350 cursor-pointer disabled:opacity-50"
                >
                  {act.label}
                </button>
              ))
            )}
          </div>

          {/* Chat answer reader scroll */}
          <div className="flex-grow overflow-y-auto p-4 select-text">
            {tutorLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-[9px] text-slate-400">AI Code Auditor reviewing code logic patterns...</p>
              </div>
            ) : tutorOutput ? (
              <div className="prose dark:prose-invert">{renderTutorMarkdown(tutorOutput)}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-[200px] mx-auto select-none">
                <BookOpen className="w-8 h-8 text-slate-300" />
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-white">AI Learning Mode</h5>
                  <p className="text-[8px] text-slate-450 leading-relaxed mt-1">
                    Select one of the helper tabs above to inspect algorithmic optimizations, complexities, or test cases.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
