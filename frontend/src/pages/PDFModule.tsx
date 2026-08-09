import React, { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  Upload,
  FileText,
  Trash2,
  Bookmark,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  Share2,
  CheckCircle,
  Clock,
  FileCheck,
  Download,
  ZoomIn,
  ZoomOut,
  Layers,
  Info,
  Compass,
  Star,
  Copy,
  Printer,
  RotateCw,
  Edit2,
  AlertCircle
} from "lucide-react";

interface PDFItem {
  _id: string;
  filename: string;
  title: string;
  summary: string;
  extracted_text?: string;
  outline: Array<{ title: string; page: number }>;
  bookmarks: number[];
  page_count: number;
  file_size: number;
  file_path: string;
  est_reading_time: number;
  last_opened: string;
  reading_progress: {
    last_page: number;
    pages_read: number[];
    completion_pct: number;
    time_spent: number;
  };
  ai_analysis?: any;
  created_at: string;
  is_favorite?: boolean;
  annotations?: any[];
  highlights?: any[];
}

export const PDFModule: React.FC = () => {
  const { addToast } = useNotifications();
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [activePdf, setActivePdf] = useState<PDFItem | null>(null);
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  
  // Library toolbar states
  const [searchBookQuery, setSearchBookQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "size" | "last_opened">("recent");
  const [filterFav, setFilterFav] = useState(false);

  // PDF.js rendering states
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1.15);
  const [rotation, setRotation] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  
  // Bookmarks & local states
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  
  // Drawing Canvas overlays toolbar
  const [drawMode, setDrawMode] = useState<"pointer" | "freehand" | "rect" | "circle" | "arrow" | "text" | "eraser">("pointer");
  const [drawColor, setDrawColor] = useState("#8B5CF6"); // default purple
  const [drawThickness, setDrawThickness] = useState(2);
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);

  // Text highlight active color
  const [activeHighlightColor, setActiveHighlightColor] = useState("#fef08a"); // light yellow

  // Offline support variables
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<any[]>([]);

  // Background Job Progress States
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const pollingIntervalRef = useRef<any>(null);
  
  // AI analysis states
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [estTime, setEstTime] = useState(1);
  const [outline, setOutline] = useState<Array<{ title: string; page: number }>>([]);
  const [readingProgress, setReadingProgress] = useState<any>({
    last_page: 1,
    pages_read: [1],
    completion_pct: 0,
    time_spent: 0
  });

  // Search in PDF
  const [searchText, setSearchText] = useState("");
  const [searchMatches, setSearchMatches] = useState<Array<{ page: number; snippet: string }>>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Left & Right sidebar tabs
  const [activeLeftTab, setActiveLeftTab] = useState<"outline" | "bookmarks" | "pages" | "citations">("outline");
  const [activeRightTab, setActiveRightTab] = useState<
    "overview" | "summary" | "concepts" | "definitions" | "points" | "chapters" | "flashcards" | "quiz" | "mindmap" | "tutor" | "notes"
  >("overview");

  // AI Tutor chat states
  const [chatMessages, setChatMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    page_number?: number | string;
    chapter_name?: string;
    source_citation?: string;
    highlighted_paragraph?: string;
    confidence_score?: number;
    not_found?: boolean;
  }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Flashcards recall states
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Interactive Quiz practice states
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showQuizFeedback, setShowQuizFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard" | "expert">("medium");

  // Notion-style notes per page
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("Chapter Summaries");

  // SVG Mindmap expanding nodes
  const [mindMapExpandedNodes, setMindMapExpandedNodes] = useState<string[]>(["Root"]);

  // Upload hooks
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize network offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast("Connection Lost", "Workspace running in offline mode. Changes cached locally.", "warning");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineSyncQueue]);

  // Load PDF.js script dynamically
  const loadPdfLibrary = () => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      script.onload = () => {
        const workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        try {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `data:text/javascript;base64,${btoa('importScripts("' + workerSrc + '");')}`;
        } catch (e) {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
        }
        resolve((window as any).pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js libraries."));
      document.head.appendChild(script);
    });
  };

  // Poll background processing status
  const startPollingJobStatus = (pdfId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setJobStatus("extracting");
    setJobProgress(15);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/pdf/jobs/${pdfId}`);
        const status = res.data.status;
        const progress = res.data.progress_pct;
        setJobStatus(status);
        setJobProgress(progress);
        
        if (status === "completed") {
          clearInterval(pollingIntervalRef.current);
          setJobStatus(null);
          addToast("AI Analysis Ready", "Vector index and dashboard generated successfully.", "success");
          fetchPDFDetails(pdfId);
          loadPDFsListOnly(pdfId);
        } else if (status === "failed") {
          clearInterval(pollingIntervalRef.current);
          setJobStatus(null);
          addToast("Indexing Failed", "Could not complete background processing: " + res.data.error, "error");
        }
      } catch (err) {
        clearInterval(pollingIntervalRef.current);
        setJobStatus(null);
      }
    }, 1500);
  };

  const loadPDFsListOnly = async (activeId?: string) => {
    try {
      const res = await api.get("/api/pdf");
      setPdfs(res.data);
      if (activeId) {
        setSelectedPdfIds([activeId]);
      } else if (res.data.length > 0 && selectedPdfIds.length === 0) {
        setSelectedPdfIds([res.data[0]._id]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPDFs = async (selectId?: string) => {
    try {
      const res = await api.get("/api/pdf");
      setPdfs(res.data);
      if (res.data.length > 0) {
        const targetId = selectId || res.data[0]._id;
        setActivePdfId(targetId);
        setSelectedPdfIds([targetId]);
        fetchPDFDetails(targetId);
      } else {
        setActivePdfId(null);
        setActivePdf(null);
        setPdfDoc(null);
        setAiAnalysis(null);
        setSelectedPdfIds([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPDFs();
  }, []);

  // Fetch metadata details
  const fetchPDFDetails = async (pdfId: string) => {
    try {
      const res = await api.get(`/api/pdf/${pdfId}`);
      const pdfItem = res.data as PDFItem;
      
      // Start background polling if AI analysis is null, but DO NOT block the UI
      if (pdfItem.ai_analysis === null) {
        startPollingJobStatus(pdfId);
      }
      
      setActivePdf(pdfItem);
      setOutline(pdfItem.outline || []);
      setBookmarks(pdfItem.bookmarks || []);
      setPageCount(pdfItem.page_count || 1);
      setReadingProgress(pdfItem.reading_progress || { last_page: 1, pages_read: [1], completion_pct: 0, time_spent: 0 });
      setEstTime(pdfItem.est_reading_time || 5);
      setCurrentPageNum(pdfItem.reading_progress?.last_page || 1);
      setAnnotations(pdfItem.annotations || []);
      setHighlights(pdfItem.highlights || []);
      
      const analysis = pdfItem.ai_analysis || {};
      setAiAnalysis(analysis);
      
      if (analysis.study_tools?.quiz) {
        setQuizQuestions(analysis.study_tools.quiz);
      } else {
        setQuizQuestions([]);
      }
      
      if (analysis.study_tools?.flashcards) {
        setFlashcards(analysis.study_tools.flashcards);
      } else if (analysis.study_tools?.cards) {
        setFlashcards(analysis.study_tools.cards);
      } else {
        setFlashcards([]);
      }
      
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setShowQuizFeedback(false);
      setQuizScore(0);
      setQuizCompleted(false);
      setChatMessages([]);
      setSearchText("");
      setSearchMatches([]);

      const cheatSheet = analysis.study_tools?.cheat_sheet || "";
      setNoteContent(cheatSheet || `### Revision Notes: ${pdfItem.title}\n\nKey takeaways:\n- Summarize major concepts here.`);
      
      const fileBasename = pdfItem.file_path.split(/[\\/]/).pop();
      if (fileBasename) {
        loadPdfDocument(fileBasename, pdfItem.reading_progress?.last_page || 1);
      }
    } catch (e) {
      addToast("Error", "Could not load document analysis.", "error");
    }
  };

  const loadPdfDocument = async (fileBasename: string, initialPage: number) => {
    setPdfLoading(true);
    setPdfDoc(null);
    try {
      const pdfjsLib = await loadPdfLibrary() as any;
      const baseUrl = api.defaults.baseURL || "http://localhost:5000";
      const pdfUrl = `${baseUrl}/uploads/${fileBasename}`;
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setCurrentPageNum(initialPage);
    } catch (err) {
      console.error("PDF.js doc loading error:", err);
      addToast("Viewer Error", "Failed to render PDF using PDF.js.", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Navigate to page slot
  const handlePageNavigate = async (newPage: number) => {
    if (!activePdfId || newPage < 1 || newPage > pageCount) return;
    setCurrentPageNum(newPage);

    // Scroll container to target page container
    const pageEl = document.getElementById(`pdf-page-container-${newPage}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (!isOnline) {
      // Offline fallback caching
      const progress = {
        last_page: newPage,
        pages_read: Array.from(new Set([...(readingProgress.pages_read || [1]), newPage])),
        completion_pct: Math.min(100, Math.round(((readingProgress.pages_read?.length || 1) / pageCount) * 100)),
        time_spent: (readingProgress.time_spent || 0) + 15
      };
      setReadingProgress(progress);
      queueOfflineSync("PUT", `/api/pdf/${activePdfId}/progress`, { page: newPage, time_spent: 15 });
      return;
    }

    try {
      const res = await api.put(`/api/pdf/${activePdfId}/progress`, {
        page: newPage,
        time_spent: 15
      });
      setReadingProgress(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Dispatch queue changes when connection is online
  const queueOfflineSync = (method: "PUT" | "POST", url: string, payload: any) => {
    setOfflineSyncQueue(prev => [...prev, { method, url, payload }]);
  };

  const syncOfflineQueue = async () => {
    if (offlineSyncQueue.length === 0) return;
    addToast("Syncing", "Uploading cached offline reading updates...", "info");
    for (const item of offlineSyncQueue) {
      try {
        if (item.method === "PUT") {
          await api.put(item.url, item.payload);
        } else {
          await api.post(item.url, item.payload);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setOfflineSyncQueue([]);
    addToast("Online Sync Complete", "Database updated successfully.", "success");
    if (activePdfId) fetchPDFDetails(activePdfId);
  };

  // Auto zoom functions
  const handleFitWidth = () => {
    setZoomLevel(1.5);
  };

  const handleFitPage = () => {
    setZoomLevel(0.95);
  };

  // Upload handler functions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadSingleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadSingleFile(e.target.files[0]);
    }
  };

  const uploadSingleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      addToast("Invalid File", "Only PDF documents are allowed.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast("Size Limit Exceeded", "Maximum file size limit is 10MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    addToast("Uploading File", "Processing text, extracting pages, and generating RAG index...", "info");

    try {
      const res = await api.post("/api/pdf/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      addToast("Upload Successful", `Indexing: ${file.name}`, "success");
      setActivePdfId(res.data._id);
      setSelectedPdfIds([res.data._id]);
      setPdfDoc(null);
      setAiAnalysis(null);
      startPollingJobStatus(res.data._id);
    } catch (err: any) {
      addToast("Upload Failed", err.response?.data?.message || "Could not process PDF document.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePDF = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this textbook from your library?")) return;
    try {
      await api.delete(`/api/pdf/${pdfId}`);
      addToast("Removed", "Textbook removed successfully.", "success");
      loadPDFs();
    } catch (err) {
      addToast("Error", "Failed to delete document.", "error");
    }
  };

  // Search function inside pages
  const handlePDFTextSearch = async () => {
    if (!searchText.trim() || !activePdfId) return;
    try {
      const res = await api.get(`/api/pdf/${activePdfId}/search?q=${encodeURIComponent(searchText)}`);
      setSearchMatches(res.data);
      setActiveMatchIndex(0);
      if (res.data.length > 0) {
        addToast("Search Complete", `Found ${res.data.length} matches.`, "success");
        handlePageNavigate(res.data[0].page);
      } else {
        addToast("No Matches", "No matching text found.", "info");
      }
    } catch (e) {
      addToast("Search failed", "Could not complete text search.", "error");
    }
  };

  // Toggle bookmark page
  const handleToggleBookmark = async (page: number) => {
    if (!activePdfId) return;
    try {
      const res = await api.post(`/api/pdf/${activePdfId}/bookmark`, { page });
      setBookmarks(res.data.bookmarks);
      addToast("Bookmark Updated", `Page ${page} bookmarked.`, "success");
    } catch (e) {
      addToast("Error", "Failed to toggle bookmark.", "error");
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (pdfId: string, currentFav: boolean) => {
    try {
      const res = await api.put(`/api/pdf/${pdfId}`, { is_favorite: !currentFav });
      addToast(res.data.is_favorite ? "Starred" : "Unstarred", "Library updated.", "success");
      loadPDFsListOnly(activePdfId || undefined);
    } catch (err) {
      addToast("Error", "Failed to update favorites.", "error");
    }
  };

  // Rename PDF
  const handleRenamePDF = async (pdfId: string) => {
    const newTitle = window.prompt("Enter new title for this textbook:");
    if (!newTitle) return;
    try {
      await api.put(`/api/pdf/${pdfId}`, { title: newTitle });
      addToast("Renamed", "Title updated successfully.", "success");
      loadPDFs(pdfId);
    } catch (err) {
      addToast("Error", "Failed to rename.", "error");
    }
  };

  // Duplicate PDF
  const handleDuplicatePDF = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/pdf/${pdfId}/duplicate`);
      addToast("Duplicated", "Copy added to Library.", "success");
      loadPDFs(res.data._id);
    } catch (err) {
      addToast("Error", "Failed to duplicate textbook.", "error");
    }
  };

  // Save personal notes to the DB Notes module
  const handleSaveNotesWorkspace = async () => {
    if (!noteContent.trim()) return;
    try {
      const title = activePdf ? `Notes: ${activePdf.title}` : "PDF Lecture Notes";
      await api.post("/api/ai/action/save-note", {
        content: noteContent,
        title: title
      });
      addToast("Saved", "Notes synchronized directly to Study Notes workspace!", "success");
    } catch (err) {
      addToast("Error", "Could not save notes.", "error");
    }
  };

  const handleExportText = (format: "markdown" | "txt") => {
    if (!activePdf) return;
    let content = `# StudySphere Notes: ${activePdf.title}\n\n`;
    content += `## Personal Revision Notes\n${noteContent}\n\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activePdf.title.toLowerCase().replace(/\s+/g, "_")}_notes.${format === "markdown" ? "md" : "txt"}`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("Exported", "Notes downloaded successfully.", "success");
  };

  // AI Tutor Q&A post handler supporting multiple PDF targets
  const handleAskPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || selectedPdfIds.length === 0 || chatLoading) return;

    const userQuery = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setChatLoading(true);

    try {
      const res = await api.post(`/api/pdf/${selectedPdfIds[0]}/ask`, {
        question: userQuery,
        pdf_ids: selectedPdfIds
      });
      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: res.data.answer,
        page_number: res.data.page_number,
        chapter_name: res.data.chapter_name,
        source_citation: res.data.source_citation,
        highlighted_paragraph: res.data.highlighted_paragraph,
        confidence_score: res.data.confidence_score,
        not_found: res.data.not_found
      }]);
    } catch (err) {
      addToast("Failed", "AI Tutor RAG retrieval request failed.", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const toggleSelectPdf = (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPdfIds((prev) =>
      prev.includes(pdfId)
        ? prev.length > 1 ? prev.filter((id) => id !== pdfId) : prev
        : [...prev, pdfId]
    );
  };

  const handleGoToCitation = (pdfId: string, page: number) => {
    if (pdfId === activePdfId) {
      handlePageNavigate(page);
    } else {
      setActivePdfId(pdfId);
      fetchPDFDetails(pdfId);
      setTimeout(() => {
        handlePageNavigate(page);
      }, 600);
      addToast("Switched Document", "Loading cited source textbook...", "info");
    }
  };

  const toggleMindMapNode = (nodeId: string) => {
    setMindMapExpandedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  // Dynamic AI actions trigger
  const handleTriggerAIAction = async (action: string) => {
    if (!activePdfId) return;
    addToast("Generating", `Compiling AI ${action} outline...`, "info");
    try {
      const res = await api.post(`/api/pdf/${activePdfId}/ask`, {
        question: `Based on the active page context, please execute this learning action: ${action}. Write the response in a highly structured revision checklist format.`,
        pdf_ids: [activePdfId]
      });
      setNoteContent(prev => `${prev}\n\n### AI ${action} Output (Page ${currentPageNum})\n${res.data.answer}`);
      setActiveRightTab("notes");
      addToast("Completed", `${action} loaded directly into Revision Notes.`, "success");
    } catch (err) {
      addToast("Action Failed", "AI failed to parse details.", "error");
    }
  };

  // Generate Flashcards one-click
  const handleGenerateFlashcardHighlight = async () => {
    if (!activePdf) return;
    addToast("Creating", "Generating active recall cards deck...", "info");
    try {
      await api.post("/api/flashcards/generate", {
        category: activePdf.title,
        text_input: `Generate flashcards based on this textbook revision note: ${noteContent}`
      });
      addToast("Flashcard Created", "Decks added directly to study Flashcards module!", "success");
    } catch (err) {
      addToast("Failed", "Flashcard generation error.", "error");
    }
  };

  // Generate Quiz
  const handleGenerateQuizTextbook = async () => {
    if (!activePdf) return;
    addToast("Generating Quiz", "Creating MCQ Practice Questions...", "info");
    try {
      await api.post("/api/quiz/generate", {
        subject: `Textbook context: ${activePdf.title} (Focus area: ${noteContent.slice(0, 500)})`,
        difficulty: quizDifficulty,
        count: 5
      });
      addToast("Quiz Generated", "A practice quiz has been added to Quiz module!", "success");
    } catch (err) {
      addToast("Failed", "Quiz generation failed.", "error");
    }
  };

  // History states for Undo/Redo
  const [annotationHistory, setAnnotationHistory] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);

  const updateAnnotationsAndHistory = (newAnnotations: any[]) => {
    setAnnotationHistory(prev => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newAnnotations);
    if (!activePdfId) return;
    if (isOnline) {
      api.put(`/api/pdf/${activePdfId}`, { annotations: newAnnotations }).catch(() => {});
    } else {
      queueOfflineSync("PUT", `/api/pdf/${activePdfId}`, { annotations: newAnnotations });
    }
  };

  const handleUndo = useCallback(() => {
    if (annotationHistory.length === 0) return;
    const prev = annotationHistory[annotationHistory.length - 1];
    setAnnotationHistory(prevHistory => prevHistory.slice(0, -1));
    setRedoStack(prevRedo => [annotations, ...prevRedo]);
    setAnnotations(prev);
    if (activePdfId) {
      api.put(`/api/pdf/${activePdfId}`, { annotations: prev }).catch(() => {});
    }
  }, [annotations, annotationHistory, activePdfId]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(prevRedo => prevRedo.slice(1));
    setAnnotationHistory(prevHistory => [...prevHistory, annotations]);
    setAnnotations(next);
    if (activePdfId) {
      api.put(`/api/pdf/${activePdfId}`, { annotations: next }).catch(() => {});
    }
  }, [annotations, redoStack, activePdfId]);

  const handleAddAnnotation = (anno: any) => {
    const updated = [...annotations, anno];
    updateAnnotationsAndHistory(updated);
  };

  const handleUpdateAnnotation = (updatedAnno: any) => {
    const updated = annotations.map(a => a.id === updatedAnno.id ? updatedAnno : a);
    updateAnnotationsAndHistory(updated);
  };

  const handleDeleteAnnotation = useCallback((annoId: string) => {
    const updated = annotations.filter(a => a.id !== annoId);
    updateAnnotationsAndHistory(updated);
    setSelectedAnnoId(null);
  }, [annotations, activePdfId, isOnline, offlineSyncQueue]);

  // Global keydown listeners for escape, delete, duplicate (Ctrl+D), undo (Ctrl+Z) and redo (Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape exits drawing modes and clears selection
      if (e.key === "Escape") {
        setSelectedAnnoId(null);
        setDrawMode("pointer");
      }
      // Delete removes selected annotation
      if (e.key === "Delete" && selectedAnnoId) {
        handleDeleteAnnotation(selectedAnnoId);
      }
      // Ctrl + D duplicates selected annotation
      if (e.ctrlKey && e.key.toLowerCase() === "d" && selectedAnnoId) {
        e.preventDefault();
        const target = annotations.find(a => a.id === selectedAnnoId);
        if (target) {
          const clone = {
            ...target,
            id: Math.random().toString(36).substring(2, 9),
            x: target.x !== undefined ? target.x + 20 : undefined,
            y: target.y !== undefined ? target.y + 20 : undefined,
            x2: target.x2 !== undefined ? target.x2 + 20 : undefined,
            y2: target.y2 !== undefined ? target.y2 + 20 : undefined,
            path: target.path ? target.path.replace(/([MLQ])\s*([\d.-]+)\s+([\d.-]+)/g, (_: string, cmd: string, px: string, py: string) => {
              return `${cmd} ${parseFloat(px) + 20} ${parseFloat(py) + 20}`;
            }) : undefined
          };
          handleAddAnnotation(clone);
          setSelectedAnnoId(clone.id);
        }
      }
      // Ctrl + Z (Undo)
      if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl + Shift + Z or Ctrl + Y (Redo)
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") || (e.ctrlKey && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAnnoId, annotations, annotationHistory, redoStack, activePdfId, handleUndo, handleRedo, handleDeleteAnnotation]);

  // Highlights handler callback
  const handleAddHighlight = (highlight: any) => {
    const updated = [...highlights, highlight];
    setHighlights(updated);
    if (!activePdfId) return;
    if (isOnline) {
      api.put(`/api/pdf/${activePdfId}`, { highlights: updated }).catch(() => {});
    } else {
      queueOfflineSync("PUT", `/api/pdf/${activePdfId}`, { highlights: updated });
    }
  };

  // Outline RAG trigger
  const handleGenerateAIOutline = async () => {
    if (!activePdfId) return;
    addToast("Generating Outline", "AI is compiling chapter outline...", "info");
    try {
      const res = await api.post(`/api/pdf/${activePdfId}/outline/ai`);
      setOutline(res.data);
      addToast("Outline Generated", "Chapter outline generated successfully.", "success");
    } catch (err) {
      addToast("AI Failed", "Failed to compile chapter outline.", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!activePdf) return;
    const link = document.createElement("a");
    link.href = `${api.defaults.baseURL || "http://localhost:5000"}/uploads/${activePdf.file_path.split(/[\\/]/).pop()}`;
    link.download = activePdf.filename;
    link.click();
  };

  // Sorting and Filtering PDFs List
  const filteredPdfs = pdfs
    .filter(p => p.title.toLowerCase().includes(searchBookQuery.toLowerCase()) || p.filename.toLowerCase().includes(searchBookQuery.toLowerCase()))
    .filter(p => !filterFav || p.is_favorite)
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "size") return b.file_size - a.file_size;
      if (sortBy === "last_opened") return new Date(b.last_opened).getTime() - new Date(a.last_opened).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex border border-white/5 bg-[#12131A] rounded-3xl overflow-hidden shadow-xl w-full">
      
      {/* LEFT SIDEBAR: Library & Document outlines */}
      <div className="w-[280px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#11121A] overflow-hidden select-none">
        
        {/* Upload Action */}
        <div className="p-3.5 border-b border-white/5 flex-shrink-0 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full premium-button-primary cursor-pointer animate-pulse"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? "Analyzing..." : "Upload Textbook"}
          </button>
        </div>

        {/* Library Filters */}
        <div className="p-2 border-b border-white/5 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchBookQuery}
              onChange={(e) => setSearchBookQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-[10px] bg-[#181922] border border-white/5 rounded-lg text-white outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 items-center justify-between text-[9px]">
            <button
              onClick={() => setFilterFav(!filterFav)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-all cursor-pointer ${
                filterFav ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-white/5 text-slate-400"
              }`}
            >
              <Star className="w-2.5 h-2.5 fill-current" /> Favorites
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#181922] border border-white/5 rounded px-1.5 py-0.5 text-slate-400 outline-none text-[9px] cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="title">Title</option>
              <option value="size">Size</option>
              <option value="last_opened">Last Opened</option>
            </select>
          </div>
        </div>

        {/* Library Store List */}
        <div className="p-2 border-b border-white/5 max-h-[350px] overflow-y-auto space-y-2.5 flex-shrink-0 scrollbar-none">
          {filteredPdfs.length === 0 ? (
            <div className="text-center py-4 text-[9px] text-slate-500">Library empty matching query.</div>
          ) : (
            filteredPdfs.map((pdf) => {
              const isActive = pdf._id === activePdfId;
              const isSelected = selectedPdfIds.includes(pdf._id);
              return (
                <div
                  key={pdf._id}
                  onClick={() => {
                    setActivePdfId(pdf._id);
                    fetchPDFDetails(pdf._id);
                  }}
                  className={`group p-3 rounded-[20px] border transition-all cursor-pointer relative flex flex-col gap-2 select-none ${
                    isActive
                      ? "bg-[#181922] border-indigo-500/30 shadow-[0_10px_30px_rgba(125,85,255,0.1)] text-white"
                      : "border-transparent bg-[#161720]/40 text-slate-400 hover:bg-[#181922] hover:border-indigo-500/10"
                  }`}
                >
                  {/* Title & Selection */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => toggleSelectPdf(pdf._id, e)}
                        onChange={() => {}}
                        className="w-3 h-3 accent-indigo-500 rounded cursor-pointer flex-shrink-0"
                      />
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                      <span className="text-[10px] font-bold truncate max-w-[130px] text-white" title={pdf.title}>
                        {pdf.title}
                      </span>
                    </div>
                    
                    {/* Favorite Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(pdf._id, !!pdf.is_favorite);
                      }}
                      className={`p-0.5 rounded transition-colors ${pdf.is_favorite ? "text-amber-500" : "text-slate-550 hover:text-amber-500"}`}
                    >
                      <Star className={`w-3 h-3 ${pdf.is_favorite ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                  </div>

                  {/* Metadata Row: Pages & Size */}
                  <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
                    <span>📄 {pdf.page_count || 1} pages</span>
                    <span>💾 {pdf.file_size ? (pdf.file_size / (1024 * 1024)).toFixed(1) + " MB" : "0.5 MB"}</span>
                  </div>

                  {/* Reading Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] text-slate-500">
                      <span>Progress</span>
                      <span className="font-bold">{pdf.reading_progress?.completion_pct || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-550 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pdf.reading_progress?.completion_pct || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Upload Date & Last Opened Info */}
                  <div className="flex justify-between items-center text-[7px] text-slate-500">
                    <span>Uploaded: {pdf.created_at ? new Date(pdf.created_at).toLocaleDateString() : "Today"}</span>
                    <span>Opened: {pdf.last_opened ? new Date(pdf.last_opened).toLocaleDateString() : "Never"}</span>
                  </div>

                  {/* Actions overlay visible on hover */}
                  <div className="flex items-center gap-1 bg-[#12131A]/90 p-1 rounded-lg border border-white/5 absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenamePDF(pdf._id);
                      }}
                      className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-indigo-400"
                      title="Rename"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicatePDF(pdf._id, e)}
                      className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-indigo-400"
                      title="Duplicate"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeletePDF(pdf._id, e)}
                      className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Adobe tab selector */}
        <div className="flex border-b border-white/5 bg-slate-950/40 p-1 justify-around select-none flex-shrink-0">
          {[
            { id: "outline", label: "Outline", icon: FolderOpen },
            { id: "pages", label: "Pages", icon: Layers },
            { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
            { id: "citations", label: "Citations", icon: FileText }
          ].map((tab) => {
            const isSelected = activeLeftTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id as any)}
                title={tab.label}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isSelected 
                    ? "bg-indigo-650 text-white shadow" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/20"
                }`}
              >
                <tab.icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Navigation list contents */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-2">
            {activePdfId ? (
              <>
                {activeLeftTab === "outline" && (
                  outline.length > 0 ? (
                    <div className="space-y-1">
                      {outline.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePageNavigate(item.page)}
                          className={`w-full text-left p-2 rounded-lg text-[10px] font-medium transition-all flex items-center justify-between hover:bg-white/5 cursor-pointer ${
                            currentPageNum === item.page ? "text-indigo-400 bg-indigo-500/5 font-extrabold" : "text-slate-400"
                          }`}
                        >
                          <span className="truncate max-w-[170px]">{item.title}</span>
                          <span className="text-[9px] text-slate-505 font-mono">p.{item.page}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-[9px] text-slate-500">No outline extracted from PDF bookmarks.</p>
                      <button
                        onClick={handleGenerateAIOutline}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer"
                      >
                        Generate AI Outline
                      </button>
                    </div>
                  )
                )}

                {activeLeftTab === "pages" && (
                  <div className="grid grid-cols-2 gap-2 p-1">
                    {Array.from({ length: pageCount }, (_, idx) => {
                      const pageNum = idx + 1;
                      const isCurrent = currentPageNum === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageNavigate(pageNum)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:border-indigo-500/30 ${
                            isCurrent
                              ? "border-indigo-500 bg-indigo-500/5 text-white font-extrabold"
                              : "border-white/5 bg-[#12131A] text-slate-400"
                          }`}
                        >
                          <div className="w-16 h-20 rounded bg-slate-900/40 flex items-center justify-center text-[10px] font-mono border border-white/5 shadow-inner">
                            p. {pageNum}
                          </div>
                          <span className="text-[9px] font-bold">Page {pageNum}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeLeftTab === "bookmarks" && (
                  bookmarks.length > 0 ? (
                    <div className="space-y-1">
                      {bookmarks.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageNavigate(page)}
                          className={`w-full text-left p-2 rounded-lg text-[10px] font-medium transition-all flex items-center justify-between hover:bg-white/5 cursor-pointer ${
                            currentPageNum === page ? "text-indigo-400 bg-indigo-500/5 font-extrabold" : "text-slate-400"
                          }`}
                        >
                          <span>Page {page} Bookmark</span>
                          <Bookmark className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[9px] text-slate-505">No bookmarks saved yet.</div>
                  )
                )}

                {activeLeftTab === "citations" && (
                  chatMessages.filter(msg => msg.role === "assistant" && msg.page_number).length > 0 ? (
                    <div className="space-y-2">
                      {chatMessages
                        .filter(msg => msg.role === "assistant" && msg.page_number)
                        .map((msg, idx) => {
                          const page = Number(msg.page_number);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleGoToCitation(activePdfId, page)}
                              className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 text-[10.5px] text-slate-300 hover:text-white flex flex-col gap-1 transition-all cursor-pointer"
                            >
                              <div className="flex justify-between items-center w-full font-bold text-[9px] text-indigo-400">
                                <span>CITATION #{idx + 1}</span>
                                <span>p. {page}</span>
                              </div>
                              <p className="line-clamp-2 text-slate-500 italic text-[9.5px]">{msg.source_citation || "Source excerpt annotation"}</p>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[9px] text-slate-500 leading-normal px-2">Ask the AI Tutor a question in the right tab to generate source citations.</div>
                  )
                )}
              </>
            ) : (
              <div className="text-center py-8 text-[9px] text-slate-500">Select a PDF file.</div>
            )}
          </div>
        </div>

      </div>

      {/* CENTER VIEWPORT: Scrollable Multi-Page Lazy Viewer */}
      <div className="flex-grow flex flex-col bg-[#0B0B12] overflow-hidden relative">
        
        {/* Connection status overlay */}
        {!isOnline && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-1.5 text-[10px] text-amber-405 flex items-center justify-between z-25 font-bold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Working Offline — changes will sync once internet restores
            </span>
          </div>
        )}



        {activePdfId ? (
          <>
            {/* Viewport Toolbar controls */}
            <div className="px-5 py-3 border-b border-white/5 bg-[#12131A] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10 select-none">
              
              {/* Document Name */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[11px] font-bold text-white truncate max-w-[200px]" title={activePdf?.title}>
                  {activePdf?.title}
                </h4>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-[#181922] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
                  className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono font-bold w-10 text-center text-slate-400 select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.15))}
                  className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-white/5 mx-0.5" />
                <button
                  onClick={handleFitWidth}
                  className="px-2 py-1 rounded text-[8px] font-extrabold uppercase hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                >
                  Fit Width
                </button>
                <button
                  onClick={handleFitPage}
                  className="px-2 py-1 rounded text-[8px] font-extrabold uppercase hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                >
                  Fit Page
                </button>
              </div>

              {/* Rotate and Export Controls */}
              <div className="flex items-center gap-1 bg-[#181922] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  title="Rotate Document"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  title="Print PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search input inside PDF */}
              <div className="flex items-center gap-1.5 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search text..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePDFTextSearch()}
                    className="premium-input pl-8 pr-4 w-32 focus:w-44 transition-all h-8 text-[10px]"
                  />
                </div>
                {searchMatches.length > 0 && (
                  <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-lg border border-indigo-500/20 font-black">
                    {searchMatches.length} Matches
                  </span>
                )}
              </div>
              
              {/* Bookmark status */}
              <button
                onClick={() => handleToggleBookmark(currentPageNum)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  bookmarks.includes(currentPageNum)
                    ? "text-indigo-500 border-indigo-500/25 bg-indigo-500/5 shadow-inner"
                    : "text-slate-400 border-white/5 hover:bg-white/5"
                }`}
                title="Bookmark Page"
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarks.includes(currentPageNum) ? "fill-indigo-500" : ""}`} />
              </button>

            </div>

            {/* Document stats analytics bar */}
            <div className="px-5 py-2 bg-slate-900/10 border-b border-white/5 flex flex-wrap items-center justify-between text-[9px] text-slate-400 gap-2 flex-shrink-0 font-medium select-none">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-500" /> est: {estTime} min study</span>
                <span className="flex items-center gap-1 font-mono">Page: {currentPageNum} of {pageCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">Completion:</span>
                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-650 rounded-full transition-all duration-300"
                    style={{ width: `${readingProgress.completion_pct}%` }}
                  />
                </div>
                <span className="font-mono text-white font-extrabold">{readingProgress.completion_pct}%</span>
              </div>
            </div>
            
            {/* Background analysis job status panel */}
            {jobStatus && (
              <div className="mx-5 my-2.5 p-3.5 bg-slate-900/40 border border-indigo-500/10 rounded-xl flex items-center justify-between gap-4 animate-fade-in backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-extrabold animate-pulse">
                    ⚡
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      AI Indexing in Background
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    </span>
                    <span className="text-[8px] font-bold text-slate-450 uppercase mt-0.5">
                      {jobStatus === "extracting" && "1/4: Uploading & extracting text..."}
                      {jobStatus === "indexing" && "2/4: Building semantic search index..."}
                      {jobStatus === "summarizing" && "3/4: Analyzing concepts & summarizing sections..."}
                      {jobStatus === "generating_study_tools" && "4/4: Creating study tools & flashcards..."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${jobProgress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-indigo-400">{jobProgress}%</span>
                    </div>
                    <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black">
                      Est. Remaining: {Math.max(2, Math.round((100 - jobProgress) * 0.4))}s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Viewport Renderer - Multi-Page Scroll */}
            <div 
              ref={viewportRef} 
              className="flex-grow overflow-y-auto p-4 flex flex-col items-center bg-[#12131A] gap-6 scroll-smooth select-none"
            >
              {pdfDoc ? (
                Array.from({ length: pageCount }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <PDFPageNode
                      key={pageNum}
                      pageNum={pageNum}
                      currentPageNum={currentPageNum}
                      pdfDoc={pdfDoc}
                      zoomLevel={zoomLevel}
                      rotation={rotation}
                      onVisible={(num) => setCurrentPageNum(num)}
                      highlights={highlights.filter(h => h.page === pageNum)}
                      annotations={annotations.filter(a => a.page === pageNum)}
                      onAddAnnotation={handleAddAnnotation}
                      onUpdateAnnotation={handleUpdateAnnotation}
                      onDeleteAnnotation={handleDeleteAnnotation}
                      onAddHighlight={handleAddHighlight}
                      drawMode={drawMode}
                      drawColor={drawColor}
                      drawThickness={drawThickness}
                      activeHighlightColor={activeHighlightColor}
                      selectedAnnoId={selectedAnnoId}
                      setSelectedAnnoId={setSelectedAnnoId}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500">Loading textbook pages...</div>
              )}
            </div>

            {/* Bottom Search navigation + Page navigation */}
            <div className="py-3 px-5 border-t border-white/5 flex flex-wrap items-center justify-between bg-[#12131A] flex-shrink-0 gap-3 select-none">
              
              {/* Search result navigator */}
              {searchMatches.length > 0 ? (
                <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-3 py-1.5 max-w-sm">
                  <span className="text-[9px] text-slate-500 font-bold whitespace-nowrap">Match {activeMatchIndex + 1}/{searchMatches.length} (p.{searchMatches[activeMatchIndex]?.page})</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const prev = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
                        setActiveMatchIndex(prev);
                        handlePageNavigate(searchMatches[prev].page);
                      }}
                      className="p-1 border border-white/5 rounded bg-[#181922] text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => {
                        const next = (activeMatchIndex + 1) % searchMatches.length;
                        setActiveMatchIndex(next);
                        handlePageNavigate(searchMatches[next].page);
                      }}
                      className="p-1 border border-white/5 rounded bg-[#181922] text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-[1px]" />
              )}

              {/* Page Navigator */}
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPageNum === 1}
                  onClick={() => handlePageNavigate(currentPageNum - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-white/5 rounded-xl text-[9px] font-extrabold uppercase text-slate-400 bg-[#181922] hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-505 font-bold">Page</span>
                  <input
                    type="number"
                    min={1}
                    max={pageCount}
                    value={currentPageNum}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= pageCount) handlePageNavigate(val);
                    }}
                    className="w-12 text-center py-1 rounded border border-white/5 text-[10px] outline-none font-bold bg-[#0B0B12] text-white"
                  />
                  <span className="text-[9px] text-slate-400 font-bold">of {pageCount}</span>
                </div>
                <button
                  disabled={currentPageNum === pageCount}
                  onClick={() => handlePageNavigate(currentPageNum + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-white/5 rounded-xl text-[9px] font-extrabold uppercase text-slate-400 bg-[#181922] hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-6 bg-[#12131A]">
            {pdfs.length > 0 ? (
              <div className="text-center space-y-5 max-w-sm mx-auto w-full p-8 border border-white/5 bg-[#181922] rounded-3xl shadow-2xl select-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mx-auto shadow-inner animate-bounce">
                  <BookOpen className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Select a Textbook</h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Choose one of the textbooks from your sidebar library to start parsing formulas, generating mindmaps, and chatting with the AI Tutor.
                  </p>
                </div>
              </div>
            ) : (
              /* Drag & drop upload box when library is empty */
              <div 
                className={`flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto w-full p-10 border border-white/5 bg-[#181922] rounded-3xl transition-all select-none ${
                  dragActive 
                    ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                    : "shadow-2xl"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                  <FolderOpen className={`w-8 h-8 transition-all duration-300 ${dragActive ? "text-indigo-400 scale-110" : "text-indigo-500"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Upload Textbook Material</h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                    Drag and drop your syllabus or chapter textbook PDF here to generate RAG index summaries and study guides.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="premium-button-primary h-10 px-6 text-xs cursor-pointer animate-pulse"
                >
                  Select PDF File
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: AI Study Dashboard */}
      {activePdfId && (
        <div className="w-[480px] flex-shrink-0 border-l border-white/5 flex bg-[#11121A] overflow-hidden">
          
          {/* Vertical icon strip navigation */}
          <div className="w-[50px] border-r border-white/5 flex flex-col items-center py-4 gap-4 bg-[#0B0B12] select-none">
            {[
              { id: "overview", label: "Study Hub Overview", icon: Info },
              { id: "summary", label: "Summary Outline", icon: FileText },
              { id: "concepts", label: "Core Concepts", icon: Sparkles },
              { id: "definitions", label: "Definitions Glossary", icon: BookOpen },
              { id: "points", label: "Important Points", icon: CheckCircle },
              { id: "chapters", label: "Chapters summaries", icon: FolderOpen },
              { id: "flashcards", label: "Recall Flashcards", icon: Layers },
              { id: "quiz", label: "Practice Quizzes", icon: HelpCircle },
              { id: "mindmap", label: "AI Concept Mindmap", icon: Share2 },
              { id: "tutor", label: "RAG AI Tutor Chat", icon: Compass },
              { id: "notes", label: "Revision Notes", icon: FileCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeRightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id as any)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer group relative ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400 font-extrabold border border-indigo-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-[#181922] border border-white/5 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow z-20">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab content panel */}
          <div className="flex-grow flex flex-col overflow-hidden">
            
            {/* Tab header title */}
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-slate-950/15 flex-shrink-0 select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                {activeRightTab.replace("_", " ")}
              </span>
              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-black">
                Study Hub
              </span>
            </div>

            {/* Scrollable content panels */}
            <div className="flex-grow overflow-y-auto p-5">
              
              {!["overview", "ai_tutor", "notes"].includes(activeRightTab) && (!aiAnalysis || Object.keys(aiAnalysis).length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in select-none">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl animate-float-robot text-indigo-400">
                    🔮
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider block">AI Analysis In Progress</span>
                    <span className="text-[8px] font-bold text-slate-450 uppercase leading-relaxed block max-w-[200px] mx-auto">
                      This features tab becomes active as soon as background semantic indexing completes.
                    </span>
                  </div>
                  {jobStatus && (
                    <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${jobProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Tab 1: OVERVIEW & STUDY HUB */}
                  {activeRightTab === "overview" && (
                <div className="space-y-4">
                  {/* Drawing Vector Toolbar */}
                  <div className="p-4 bg-[#181922] border border-white/5 rounded-2xl space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Vector Drawing Toolbar</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "pointer", label: "Select Mode" },
                        { id: "freehand", label: "Pen Brush" },
                        { id: "rect", label: "Rectangle" },
                        { id: "circle", label: "Circle" },
                        { id: "arrow", label: "Vector Line" },
                        { id: "text", label: "Text Node" },
                        { id: "eraser", label: "Clean Canvas" }
                      ].map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            if (tool.id === "eraser") {
                              setAnnotations([]);
                              addToast("Canvas Cleaned", "All annotations cleared.", "info");
                            } else {
                              setDrawMode(tool.id as any);
                            }
                          }}
                          className={`py-1 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                            drawMode === tool.id ? "bg-indigo-650 text-white animate-pulse" : "bg-[#12131A] text-slate-400 border border-white/5 hover:text-white"
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                    {drawMode !== "pointer" && (
                      <div className="flex items-center justify-between text-[9px] pt-1 select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-505 font-bold">Color:</span>
                          {["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map(col => (
                            <button
                              key={col}
                              onClick={() => setDrawColor(col)}
                              className={`w-3.5 h-3.5 rounded-full cursor-pointer border ${drawColor === col ? "border-white" : "border-transparent"}`}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">Brush Size:</span>
                          <input 
                            type="range" 
                            min="1" 
                            max="8" 
                            value={drawThickness} 
                            onChange={(e) => setDrawThickness(Number(e.target.value))}
                            className="w-16 accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick AI Study Actions */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Quick AI Page Actions</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "summary", label: "Summarize Page" },
                        { id: "explain", label: "Explain Formulas" },
                        { id: "simplify", label: "Simplify Concept" },
                        { id: "cheatsheet", label: "Cheat Sheet Outline" }
                      ].map(act => (
                        <button
                          key={act.id}
                          onClick={() => handleTriggerAIAction(act.label)}
                          className="p-3 bg-[#181922] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/25 rounded-xl text-[10px] text-left transition-all cursor-pointer font-bold text-slate-300"
                        >
                          ✨ {act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#181922] border border-white/5 rounded-2xl space-y-3 select-none">
                    <h5 className="text-[11px] font-extrabold text-white">Syllabus Overview</h5>
                    <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400">
                      <div><span className="font-bold text-slate-500">Title:</span> {aiAnalysis?.title || activePdf?.title}</div>
                      <div><span className="font-bold text-slate-500">Pages Count:</span> {pageCount}</div>
                      <div><span className="font-bold text-slate-500">Study Goal:</span> {estTime} min read</div>
                      <div><span className="font-bold text-slate-500">Chapters:</span> {aiAnalysis?.chapters?.length || outline.length}</div>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  {aiAnalysis?.learning_objectives && (
                    <div className="space-y-2 select-none">
                      <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Learning Objectives</h6>
                      <div className="space-y-1.5">
                        {aiAnalysis.learning_objectives.map((obj: string, i: number) => (
                          <div key={i} className="flex gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl items-start">
                            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{obj}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outline TOC */}
                  <div className="space-y-2 select-none">
                    <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Table of Contents</h6>
                    <div className="border border-white/5 rounded-2xl bg-[#181922] overflow-hidden divide-y divide-white/5">
                      {outline.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePageNavigate(item.page)}
                          className="w-full px-4 py-2.5 text-left text-[10px] hover:bg-white/5 transition-all flex items-center justify-between font-medium text-slate-400 cursor-pointer"
                        >
                          <span className="truncate">{item.title}</span>
                          <span className="font-mono text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded">p.{item.page}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: SUMMARY */}
              {activeRightTab === "summary" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#181922] border border-white/5 rounded-2xl shadow-sm space-y-2">
                    <h5 className="text-[11px] font-extrabold text-white">Executive Summary</h5>
                    <p className="text-[10px] leading-relaxed text-slate-400">
                      {aiAnalysis?.executive_summary || "Document summary pending analysis."}
                    </p>
                  </div>

                  {aiAnalysis?.main_ideas && (
                    <div className="p-4 bg-[#181922] border border-white/5 rounded-2xl space-y-2">
                      <h5 className="text-[11px] font-extrabold text-white">Core Main Ideas</h5>
                      <ul className="space-y-1.5 list-disc list-inside text-[10px] text-slate-400 leading-relaxed font-medium">
                        {aiAnalysis.main_ideas.map((idea: string, i: number) => (
                          <li key={i} className="marker:text-indigo-500">{idea}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis?.key_takeaways && (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                      <h5 className="text-[11px] font-extrabold text-indigo-200">Critical Takeaways</h5>
                      <ul className="space-y-1.5 text-[10px] text-indigo-300 font-medium">
                        {aiAnalysis.key_takeaways.map((takeaway: string, i: number) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="text-indigo-500 font-bold mt-0.5">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: KEY CONCEPTS */}
              {activeRightTab === "concepts" && (
                <div className="space-y-3">
                  {aiAnalysis?.key_concepts && aiAnalysis.key_concepts.length > 0 ? (
                    aiAnalysis.key_concepts.map((conceptObj: any, i: number) => (
                      <div key={i} className="p-4 border border-white/5 rounded-2xl bg-[#181922] shadow-sm space-y-1.5">
                        <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{conceptObj.concept}</h6>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {conceptObj.explanation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">Key concepts list not populated.</div>
                  )}
                </div>
              )}

              {/* Tab 4: DEFINITIONS */}
              {activeRightTab === "definitions" && (
                <div className="space-y-3">
                  {aiAnalysis?.important_definitions && aiAnalysis.important_definitions.length > 0 ? (
                    <div className="border border-white/5 rounded-2xl bg-[#181922] divide-y divide-white/5 overflow-hidden shadow-sm">
                      {aiAnalysis.important_definitions.map((defObj: any, i: number) => (
                        <div key={i} className="p-4 space-y-1 hover:bg-white/5">
                          <span className="text-[10px] font-black text-white uppercase font-mono tracking-wide block">{defObj.term}</span>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {defObj.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">Definitions glossary is empty.</div>
                  )}
                </div>
              )}

              {/* Tab 5: IMPORTANT POINTS */}
              {activeRightTab === "points" && (
                <div className="space-y-2.5">
                  {aiAnalysis?.important_points && aiAnalysis.important_points.length > 0 ? (
                    aiAnalysis.important_points.map((pt: string, i: number) => (
                      <div key={i} className="p-3 bg-[#181922] border border-white/5 rounded-xl shadow-sm flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 font-extrabold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{pt}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">No important points extracted.</div>
                  )}
                </div>
              )}

              {/* Tab 6: CHAPTER SUMMARIES */}
              {activeRightTab === "chapters" && (
                <div className="space-y-3">
                  {aiAnalysis?.chapters && aiAnalysis.chapters.length > 0 ? (
                    aiAnalysis.chapters.map((chap: any, i: number) => {
                      const nodeId = `chap_${i}`;
                      const isExpanded = mindMapExpandedNodes.includes(nodeId);
                      return (
                        <div key={i} className="border border-white/5 rounded-2xl bg-[#181922] shadow-sm overflow-hidden">
                          <button
                            onClick={() => toggleMindMapNode(nodeId)}
                            className="w-full p-4 text-left font-black text-[10.5px] uppercase flex items-center justify-between text-white hover:bg-white/5 cursor-pointer"
                          >
                            <span>{chap.chapter_name || `Chapter ${i+1}`}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                                chap.difficulty_level === "Easy" ? "bg-emerald-500/10 text-emerald-400" :
                                chap.difficulty_level === "Hard" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {chap.difficulty_level || "Medium"}
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 text-slate-505 transition-all ${isExpanded ? "rotate-90" : ""}`} />
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4 border-t border-white/5 bg-[#12131A]/40 space-y-4 text-[10px]">
                              
                              <div className="space-y-1">
                                <span className="font-extrabold uppercase text-[8px] text-slate-500 tracking-wider">Summary</span>
                                <p className="leading-relaxed text-slate-400">{chap.summary}</p>
                              </div>

                              {chap.concepts && chap.concepts.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-extrabold uppercase text-[8px] text-slate-500 tracking-wider">Concepts</span>
                                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-medium pl-1">
                                    {chap.concepts.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                                  </ul>
                                </div>
                              )}

                              {chap.definitions && chap.definitions.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="font-extrabold uppercase text-[8px] text-slate-500 tracking-wider">Glossary</span>
                                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-[#181922]">
                                    {chap.definitions.map((d: any, idx: number) => (
                                      <div key={idx} className="p-2 hover:bg-[#12131A]">
                                        <span className="font-black text-slate-355 text-[9px] uppercase font-mono block">{d.term}</span>
                                        <span className="text-slate-500 font-medium">{d.definition}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {chap.examples && chap.examples.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-extrabold uppercase text-[8px] text-slate-500 tracking-wider">Examples</span>
                                  <div className="space-y-1 pl-1">
                                    {chap.examples.map((ex: string, idx: number) => (
                                      <p key={idx} className="text-slate-500 italic">💡 "{ex}"</p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {chap.formulae && chap.formulae.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-extrabold uppercase text-[8px] text-slate-500 tracking-wider">Formulae</span>
                                  <div className="space-y-1 font-mono text-[9px] bg-slate-950 text-indigo-400 p-2 rounded-xl border border-white/5">
                                    {chap.formulae.map((eq: string, idx: number) => (
                                      <div key={idx} className="text-center">{eq}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">Chapters list is empty.</div>
                  )}
                </div>
              )}

              {/* Tab 7: FLASHCARDS */}
              {activeRightTab === "flashcards" && (
                <div className="space-y-4">
                  {flashcards.length > 0 ? (
                    <div className="flex flex-col items-center gap-6">
                      
                      {/* Interactive 3D Card flipper container */}
                      <div 
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        style={{ perspective: "1000px" }}
                        className="w-full max-w-sm h-52 cursor-pointer select-none group"
                      >
                        <div
                          style={{
                            transformStyle: "preserve-3d",
                            transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                          className="w-full h-full relative"
                        >
                          
                          {/* FRONT SIDE */}
                          <div 
                            style={{ backfaceVisibility: "hidden" }}
                            className="absolute inset-0 w-full h-full p-6 border border-white/5 rounded-2xl bg-[#181922] flex flex-col justify-between shadow-md"
                          >
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Active Recall</span>
                              <Sparkles className="w-3.5 h-3.5 text-indigo-505 animate-pulse" />
                            </div>
                            <div className="flex-grow flex items-center justify-center text-center">
                              <h5 className="text-[12px] font-black text-white leading-relaxed">
                                {flashcards[currentCardIndex]?.front}
                              </h5>
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono text-center">Click to Flip Card</span>
                          </div>

                          {/* BACK SIDE */}
                          <div 
                            style={{ 
                              backfaceVisibility: "hidden",
                              transform: "rotateY(180deg)"
                            }}
                            className="absolute inset-0 w-full h-full p-6 border border-white/5 rounded-2xl bg-[#181922] flex flex-col justify-between shadow-md"
                          >
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Answer Glossary</span>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="flex-grow flex items-center justify-center text-center overflow-y-auto py-2">
                              <p className="text-[10.5px] leading-relaxed text-slate-300 font-medium">
                                {flashcards[currentCardIndex]?.back}
                              </p>
                            </div>
                            <span className="text-[8px] text-slate-505 font-mono text-center">Click to Flip Back</span>
                          </div>

                        </div>
                      </div>

                      {/* Card deck navigator */}
                      <div className="flex items-center justify-between w-full max-w-sm border-t border-white/5 pt-4 select-none">
                        <span className="text-[9px] font-mono font-bold text-slate-500">Card {currentCardIndex + 1} of {flashcards.length}</span>
                        <div className="flex gap-2">
                          <button
                            disabled={currentCardIndex === 0}
                            onClick={() => {
                              setCurrentCardIndex(currentCardIndex - 1);
                              setIsCardFlipped(false);
                            }}
                            className="px-3 py-1.5 border border-white/5 rounded-xl text-[9px] font-extrabold uppercase bg-[#181922] text-slate-400 hover:text-white disabled:opacity-55 cursor-pointer"
                          >
                            Prev
                          </button>
                          <button
                            disabled={currentCardIndex === flashcards.length - 1}
                            onClick={() => {
                              setCurrentCardIndex(currentCardIndex + 1);
                              setIsCardFlipped(false);
                            }}
                            className="px-3 py-1.5 border border-white/5 rounded-xl text-[9px] font-extrabold uppercase bg-[#181922] text-slate-400 hover:text-white disabled:opacity-55 cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>

                      {/* Flashcard creation sync */}
                      <div className="w-full max-w-sm p-4 bg-[#181922] border border-white/5 rounded-2xl text-center space-y-2.5 select-none">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Cross-Module Integration</span>
                        <p className="text-[10px] text-slate-500">Save this recall deck directly into your StudySphere Flashcards collection.</p>
                        <button
                          onClick={handleGenerateFlashcardHighlight}
                          className="w-full premium-button-primary h-9 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Sync Recall Deck
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">Study deck cards not generated.</div>
                  )}
                </div>
              )}

              {/* Tab 8: QUIZ */}
              {activeRightTab === "quiz" && (
                <div className="space-y-4">
                  {/* Quiz Generation Inputs */}
                  <div className="p-4 bg-[#181922] border border-white/5 rounded-2xl space-y-3 select-none">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Quiz Generator</span>
                    <div className="flex gap-2 items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold">Difficulty:</span>
                      <select
                        value={quizDifficulty}
                        onChange={(e) => setQuizDifficulty(e.target.value as any)}
                        className="bg-[#12131A] border border-white/5 rounded px-2 py-1 text-slate-300 outline-none cursor-pointer"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGenerateQuizTextbook}
                      className="w-full premium-button-primary h-9 text-[10px] font-black uppercase cursor-pointer"
                    >
                      Generate Quiz Deck
                    </button>
                  </div>

                  {quizQuestions.length > 0 ? (
                    !quizCompleted ? (
                      <div className="p-4 border border-white/5 rounded-2xl bg-[#181922] shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 select-none">
                          <span className="text-[9px] font-mono font-bold text-slate-500">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                          <span className="text-[9px] font-mono font-extrabold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded">Score: {quizScore}</span>
                        </div>

                        <h5 className="text-[11.5px] font-black text-white leading-relaxed">
                          {quizQuestions[currentQuestionIndex]?.question}
                        </h5>

                        <div className="space-y-2">
                          {quizQuestions[currentQuestionIndex]?.options.map((opt: string, idx: number) => {
                            const isSelected = selectedOption === opt;
                            const isCorrect = opt === quizQuestions[currentQuestionIndex]?.correct_answer;
                            
                            let optionStyle = "border-white/5 hover:bg-[#12131A]";
                            if (showQuizFeedback) {
                              if (isCorrect) {
                                optionStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/35 font-extrabold";
                              } else if (isSelected) {
                                optionStyle = "bg-rose-500/10 text-rose-400 border-rose-500/35 font-extrabold";
                              } else {
                                optionStyle = "opacity-55 border-white/5";
                              }
                            } else if (isSelected) {
                              optionStyle = "border-indigo-500 bg-indigo-500/5 text-indigo-400 font-extrabold";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={showQuizFeedback}
                                onClick={() => setSelectedOption(opt)}
                                className={`w-full text-left p-3 rounded-xl border text-[10px] transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                              >
                                <span>{opt}</span>
                                {showQuizFeedback && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>

                        {showQuizFeedback && (
                          <div className="p-3.5 bg-[#12131A] border border-white/5 rounded-xl text-[9.5px] space-y-1.5 font-medium text-slate-400">
                            <span className="font-black text-indigo-400 uppercase block">AI Explanation:</span>
                            <p className="leading-relaxed">
                              {quizQuestions[currentQuestionIndex]?.explanation}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          {!showQuizFeedback ? (
                            <button
                              disabled={!selectedOption}
                              onClick={() => {
                                const isCorrect = selectedOption === quizQuestions[currentQuestionIndex]?.correct_answer;
                                if (isCorrect) setQuizScore(quizScore + 1);
                                setShowQuizFeedback(true);
                              }}
                              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              Submit Answer
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (currentQuestionIndex < quizQuestions.length - 1) {
                                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                                  setSelectedOption(null);
                                  setShowQuizFeedback(false);
                                } else {
                                  setQuizCompleted(true);
                                  if (isOnline) {
                                    api.post(`/api/quiz/submit/${activePdfId}`, { score: quizScore }).catch(() => {});
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-indigo-655 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-sm"
                            >
                              {currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"}
                            </button>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="p-6 border border-white/5 rounded-2xl bg-[#181922] shadow-sm text-center space-y-4 select-none">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Quiz Completed!</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Excellent practice for placements preparations.</p>
                        </div>
                        <div className="p-4 bg-[#12131A] border border-white/5 rounded-2xl max-w-xs mx-auto">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 block">Accuracy rating</span>
                          <span className="text-xl font-mono font-extrabold text-indigo-405 block mt-1">
                            {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentQuestionIndex(0);
                            setSelectedOption(null);
                            setShowQuizFeedback(false);
                            setQuizScore(0);
                            setQuizCompleted(false);
                          }}
                          className="px-4 py-2 border border-white/5 rounded-xl text-[9px] font-extrabold uppercase bg-[#12131A] text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          Restart Quiz
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-500">Practice quiz is not generated.</div>
                  )}
                </div>
              )}

              {/* Tab 9: MIND MAP */}
              {activeRightTab === "mindmap" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Visual Mind Map Tree</span>
                    <span className="text-[8px] text-slate-500">radial outline nodes</span>
                  </div>

                  <div className="p-4 border border-white/5 rounded-2xl bg-slate-950 flex justify-center items-center shadow-inner relative overflow-hidden h-[340px]">
                    {aiAnalysis?.study_tools?.mind_map ? (
                      <svg className="w-full h-full" viewBox="0 0 320 280">
                        {aiAnalysis.study_tools.mind_map.subtopics?.map((sub: any, idx: number) => {
                          const subX = 60 + idx * 100;
                          const subY = 120;
                          return (
                            <g key={idx}>
                              <line x1="160" y1="40" x2={subX} y2={subY} stroke="#4f46e5" strokeWidth="1.5" />
                              {sub.items?.map((item: string, iIdx: number) => {
                                const itemX = subX - 30 + iIdx * 30;
                                const itemY = 200;
                                return (
                                  <line key={iIdx} x1={subX} y1={subY} x2={itemX} y2={itemY} stroke="#059669" strokeWidth="1" strokeDasharray="2,2" />
                                );
                              })}
                            </g>
                          );
                        })}

                        {/* Root Node */}
                        <circle cx="160" cy="40" r="14" fill="#6366f1" />
                        <text x="160" y="43" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                          {(aiAnalysis.study_tools.mind_map.topic || "ROOT").slice(0, 10).toUpperCase()}
                        </text>

                        {/* Subtopic Nodes */}
                        {aiAnalysis.study_tools.mind_map.subtopics?.map((sub: any, idx: number) => {
                          const subX = 60 + idx * 100;
                          const subY = 120;
                          return (
                            <g key={idx}>
                              <circle cx={subX} cy={subY} r="12" fill="#10b981" />
                              <text x={subX} y={123} fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                                {sub.name.slice(0, 10)}
                              </text>

                              {/* Item Leaf Nodes */}
                              {sub.items?.map((item: string, iIdx: number) => {
                                const itemX = subX - 30 + iIdx * 30;
                                const itemY = 200;
                                return (
                                  <g key={iIdx}>
                                    <rect x={itemX - 16} y={itemY - 6} width="32" height="12" rx="3" fill="#374151" />
                                    <text x={itemX} y={itemY + 2} fill="#d1d5db" fontSize="4.5" textAnchor="middle" pointerEvents="none">
                                      {item.slice(0, 8)}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}
                      </svg>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 300 220">
                        <circle cx="150" cy="30" r="14" fill="#6366f1" />
                        <text x="150" y="33" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">ROOT</text>
                        <line x1="150" y1="44" x2="60" y2="100" stroke="#4f46e5" strokeWidth="1.5" />
                        <line x1="150" y1="44" x2="150" y2="100" stroke="#4f46e5" strokeWidth="1.5" />
                        <line x1="150" y1="44" x2="240" y2="100" stroke="#4f46e5" strokeWidth="1.5" />
                        <circle cx="60" cy="110" r="12" fill="#10b981" />
                        <text x="60" y="113" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">Summary</text>
                        <circle cx="150" cy="110" r="12" fill="#10b981" />
                        <text x="150" y="113" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">Concepts</text>
                        <circle cx="240" cy="110" r="12" fill="#10b981" />
                        <text x="240" y="113" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">Glossary</text>
                      </svg>
                    )}
                    
                    <button
                      onClick={() => addToast("Export SVG", "SVG mindmap downloaded.", "success")}
                      className="absolute bottom-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 10: TUTOR */}
              {activeRightTab === "tutor" && (
                <div className="h-[460px] flex flex-col justify-between">
                  <div className="px-3.5 py-1.5 bg-[#181922] border border-white/5 rounded-xl flex items-center justify-between text-[9px] text-slate-400 select-none flex-shrink-0 font-bold mb-3">
                    <span>Searching context:</span>
                    <span className="text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full font-black">
                      {selectedPdfIds.length} {selectedPdfIds.length === 1 ? "document" : "documents"} selected
                    </span>
                  </div>

                  {/* Messages list */}
                  <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12 space-y-3 select-none">
                        <HelpCircle className="w-9 h-9 text-slate-550 mx-auto" />
                        <p className="text-[10px] text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                          Query textbook equations or concepts. The AI Tutor answers strictly from PDF context with source page citations.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0 select-none ${
                            msg.role === "assistant" ? "bg-indigo-500/10 text-indigo-400" : "bg-[#181922] text-white border border-white/5"
                          }`}>
                            {msg.role === "assistant" ? "AI" : "ME"}
                          </div>
                          
                          <div className="flex flex-col gap-1.5 max-w-[82%]">
                            <div className={`p-3 rounded-2xl text-[10px] leading-relaxed whitespace-pre-wrap shadow-sm border ${
                              msg.role === "assistant" ? "bg-[#181922] text-slate-300 border-white/5" : "bg-indigo-600 text-white border-transparent"
                            }`}>
                              {msg.content}
                            </div>

                            {/* Citations confidence */}
                            {msg.role === "assistant" && !msg.not_found && msg.page_number && (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {msg.confidence_score !== undefined && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase font-mono select-none">
                                      Confidence: {msg.confidence_score}%
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleGoToCitation(selectedPdfIds[0], Number(msg.page_number))}
                                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[8px] font-extrabold uppercase font-mono cursor-pointer transition-all flex items-center gap-1 select-none"
                                  >
                                    Go to page {msg.page_number}
                                  </button>
                                  {msg.chapter_name && (
                                    <span className="px-2 py-0.5 rounded bg-[#181922] border border-white/5 text-slate-400 text-[8px] font-bold uppercase truncate max-w-[120px]">
                                      {msg.chapter_name}
                                    </span>
                                  )}
                                </div>
                                {msg.source_citation && (
                                  <div className="text-[8px] text-slate-500 font-bold italic">
                                    Citation: {msg.source_citation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex gap-3.5 items-center select-none">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-spin">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="p-3 bg-[#181922] border border-white/5 rounded-2xl flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatScrollRef} />
                  </div>

                  <form onSubmit={handleAskPDF} className="flex gap-2 pt-3.5 border-t border-white/5 flex-shrink-0 mt-3.5">
                    <input
                      type="text"
                      placeholder="Query PDF context..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-grow px-3 py-2 rounded-xl border border-white/5 bg-[#0B0B12] text-[10px] text-white outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || selectedPdfIds.length === 0 || chatLoading}
                      className="p-2 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 11: REVISION NOTES */}
              {activeRightTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Textbook Notes</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleExportText("markdown")}
                        className="p-1 hover:bg-white/5 rounded text-slate-450 hover:text-white cursor-pointer"
                        title="Export Markdown"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleSaveNotesWorkspace}
                        className="px-2.5 py-1 bg-indigo-655 hover:bg-indigo-700 text-white text-[9px] font-extrabold uppercase rounded-lg cursor-pointer"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-500 block mb-1">Notes Category</label>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value)}
                        className="w-full p-2.5 border border-white/5 rounded-lg text-[10px] outline-none bg-[#0b0b12] text-white font-bold cursor-pointer"
                      >
                        <option value="Chapter Summaries">Chapter Summaries</option>
                        <option value="Revision Questions">Revision Questions</option>
                        <option value="Formula Cheatsheets">Formula Cheatsheets</option>
                        <option value="Interview Answers">Interview Answers</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold uppercase text-slate-500 block mb-1">Markdown Editor Content</label>
                      <textarea
                        rows={13}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full p-3.5 border border-white/5 rounded-xl text-[10px] outline-none font-mono resize-none bg-[#0b0b12] text-slate-350"
                        placeholder="Type bullet notes or equations..."
                      />
                    </div>
                  </div>
                </div>
              )}
              </>
            )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Custom Lazy-Rendering Multi-Page Node using IntersectionObserver
const PDFPageNode: React.FC<{
  pageNum: number;
  currentPageNum: number;
  pdfDoc: any;
  zoomLevel: number;
  rotation: number;
  onVisible: (num: number) => void;
  highlights: any[];
  annotations: any[];
  onAddAnnotation: (anno: any) => void;
  onUpdateAnnotation: (anno: any) => void;
  onDeleteAnnotation: (annoId: string) => void;
  onAddHighlight: (highlight: any) => void;
  drawMode: string;
  drawColor: string;
  drawThickness: number;
  activeHighlightColor: string;
  selectedAnnoId: string | null;
  setSelectedAnnoId: (annoId: string | null) => void;
}> = ({
  pageNum,
  currentPageNum,
  pdfDoc,
  zoomLevel,
  rotation,
  onVisible,
  highlights,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation: _onDeleteAnnotation,
  onAddHighlight,
  drawMode,
  drawColor,
  drawThickness,
  activeHighlightColor,
  selectedAnnoId,
  setSelectedAnnoId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 600, height: 800 });
  const renderTaskRef = useRef<any>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [freehandPoints, setFreehandPoints] = useState<Array<{ x: number, y: number }>>([]);
  const [drawShapePreview, setDrawShapePreview] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [drawLinePreview, setDrawLinePreview] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<any | null>(null);

  const [activeMoveId, setActiveMoveId] = useState<string | null>(null);
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);

  const isNear = pageNum >= currentPageNum - 2 && pageNum <= currentPageNum + 2;

  // Visible observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            onVisible(pageNum);
          } else {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [pageNum, onVisible]);

  // Reserve viewport dimensions
  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(pageNum).then((page: any) => {
      const viewport = page.getViewport({ scale: zoomLevel, rotation });
      setPageSize({ width: viewport.width, height: viewport.height });
    });
  }, [pdfDoc, pageNum, zoomLevel, rotation]);

  // Handle lazy page render
  useEffect(() => {
    if (!isNear || !isVisible || !pdfDoc || !canvasRef.current) {
      if ((!isVisible || !isNear) && isRendered && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setIsRendered(false);
      }
      return;
    }

    let isCancelled = false;
    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoomLevel, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err) {
        console.error("Renderer error on page", pageNum, err);
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [isNear, isVisible, pdfDoc, pageNum, zoomLevel, rotation]);

  const getMouseCoords = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getMouseCoords(e);

    // 1. SELECT MODE
    if (drawMode === "pointer") {
      if (e.target === svgRef.current) {
        setSelectedAnnoId(null);
      }
      return;
    }

    // 2. TEXT MODE
    if (drawMode === "text") {
      const newAnno = {
        id: Math.random().toString(36).substring(2, 9),
        type: "text",
        page: pageNum,
        color: drawColor,
        thickness: drawThickness,
        x: x / zoomLevel,
        y: y / zoomLevel,
        w: 150,
        h: 40,
        text: "Double click to edit",
        fontSize: 14
      };
      onAddAnnotation(newAnno);
      setSelectedAnnoId(newAnno.id);
      return;
    }

    // 3. DRAW START
    setIsDrawing(true);
    setStartPos({ x, y });

    if (drawMode === "freehand") {
      const pts = [{ x: x / zoomLevel, y: y / zoomLevel }];
      setFreehandPoints(pts);
      setCurrentPath(`M ${x / zoomLevel} ${y / zoomLevel}`);
    } else if (drawMode === "rect" || drawMode === "circle") {
      setDrawShapePreview({ x: x / zoomLevel, y: y / zoomLevel, w: 0, h: 0 });
    } else if (drawMode === "arrow") {
      setDrawLinePreview({ x1: x / zoomLevel, y1: y / zoomLevel, x2: x / zoomLevel, y2: y / zoomLevel });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getMouseCoords(e);

    // 1. MOVE ELEMENT
    if (activeMoveId) {
      const dx = (x - startPos.x) / zoomLevel;
      const dy = (y - startPos.y) / zoomLevel;
      const target = annotations.find(a => a.id === activeMoveId);
      if (target) {
        setDragPreview({
          ...target,
          x: (target.x || 0) + dx,
          y: (target.y || 0) + dy,
          x2: target.x2 !== undefined ? target.x2 + dx : undefined,
          y2: target.y2 !== undefined ? target.y2 + dy : undefined,
          path: target.path ? target.path.replace(/([MLQ])\s*([\d.-]+)\s+([\d.-]+)/g, (_: string, cmd: string, px: string, py: string) => {
            return `${cmd} ${parseFloat(px) + dx} ${parseFloat(py) + dy}`;
          }) : undefined
        });
      }
      return;
    }

    // 2. RESIZE ELEMENT
    if (activeResizeId && resizeDirection) {
      const dx = (x - startPos.x) / zoomLevel;
      const dy = (y - startPos.y) / zoomLevel;
      const target = annotations.find(a => a.id === activeResizeId);
      if (target) {
        let newX = target.x || 0;
        let newY = target.y || 0;
        let newW = target.w || 0;
        let newH = target.h || 0;

        if (resizeDirection === "tl") {
          newX = (target.x || 0) + dx;
          newY = (target.y || 0) + dy;
          newW = (target.w || 0) - dx;
          newH = (target.h || 0) - dy;
        } else if (resizeDirection === "tr") {
          newY = (target.y || 0) + dy;
          newW = (target.w || 0) + dx;
          newH = (target.h || 0) - dy;
        } else if (resizeDirection === "bl") {
          newX = (target.x || 0) + dx;
          newW = (target.w || 0) - dx;
          newH = (target.h || 0) + dy;
        } else if (resizeDirection === "br") {
          newW = (target.w || 0) + dx;
          newH = (target.h || 0) + dy;
        }

        if (newW > 5 && newH > 5) {
          setDragPreview({
            ...target,
            x: newX,
            y: newY,
            w: newW,
            h: newH
          });
        }
      }
      return;
    }

    // 3. DRAW NEW ELEMENT
    if (!isDrawing) return;

    if (drawMode === "freehand") {
      const nextPt = { x: x / zoomLevel, y: y / zoomLevel };
      const newPts = [...freehandPoints, nextPt];
      setFreehandPoints(newPts);

      let pathStr = `M ${newPts[0].x} ${newPts[0].y}`;
      for (let i = 1; i < newPts.length - 1; i++) {
        const xc = (newPts[i].x + newPts[i + 1].x) / 2;
        const yc = (newPts[i].y + newPts[i + 1].y) / 2;
        pathStr += ` Q ${newPts[i].x} ${newPts[i].y}, ${xc} ${yc}`;
      }
      if (newPts.length > 1) {
        pathStr += ` L ${newPts[newPts.length - 1].x} ${newPts[newPts.length - 1].y}`;
      }
      setCurrentPath(pathStr);
    } else if (drawMode === "rect" || drawMode === "circle") {
      const w = (x - startPos.x) / zoomLevel;
      const h = (y - startPos.y) / zoomLevel;
      setDrawShapePreview({
        x: Math.min(startPos.x / zoomLevel, x / zoomLevel),
        y: Math.min(startPos.y / zoomLevel, y / zoomLevel),
        w: Math.abs(w),
        h: Math.abs(h)
      });
    } else if (drawMode === "arrow") {
      setDrawLinePreview({
        x1: startPos.x / zoomLevel,
        y1: startPos.y / zoomLevel,
        x2: x / zoomLevel,
        y2: y / zoomLevel
      });
    }
  };

  const handleMouseUp = () => {
    if (activeMoveId || activeResizeId) {
      if (dragPreview) {
        onUpdateAnnotation(dragPreview);
      }
      setActiveMoveId(null);
      setActiveResizeId(null);
      setResizeDirection(null);
      setDragPreview(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (drawMode === "freehand" && currentPath) {
      onAddAnnotation({
        id: Math.random().toString(36).substring(2, 9),
        type: "freehand",
        page: pageNum,
        color: drawColor,
        path: currentPath,
        thickness: drawThickness
      });
    } else if ((drawMode === "rect" || drawMode === "circle") && drawShapePreview) {
      onAddAnnotation({
        id: Math.random().toString(36).substring(2, 9),
        type: drawMode,
        page: pageNum,
        color: drawColor,
        thickness: drawThickness,
        x: drawShapePreview.x,
        y: drawShapePreview.y,
        w: drawShapePreview.w,
        h: drawShapePreview.h
      });
    } else if (drawMode === "arrow" && drawLinePreview) {
      onAddAnnotation({
        id: Math.random().toString(36).substring(2, 9),
        type: "arrow",
        page: pageNum,
        color: drawColor,
        thickness: drawThickness,
        x: drawLinePreview.x1,
        y: drawLinePreview.y1,
        x2: drawLinePreview.x2,
        y2: drawLinePreview.y2
      });
    }

    setCurrentPath("");
    setFreehandPoints([]);
    setDrawShapePreview(null);
    setDrawLinePreview(null);
  };

  const handleDrawHighlight = (e: React.MouseEvent) => {
    if (drawMode !== "pointer") return;
    if (selectedAnnoId) {
      setSelectedAnnoId(null);
      return;
    }
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    onAddHighlight({
      id: Math.random().toString(36).substring(2, 9),
      page: pageNum,
      color: activeHighlightColor,
      x: x - 50,
      y: y - 10,
      w: 100,
      h: 20
    });
  };

  const selectedAnno = annotations.find(a => a.id === selectedAnnoId);

  return (
    <div 
      id={`pdf-page-container-${pageNum}`}
      ref={containerRef}
      className="relative border border-white/5 rounded-2xl overflow-hidden bg-[#181922] shadow-lg flex-shrink-0 animate-fade-in"
      style={{ width: pageSize.width, height: pageSize.height }}
    >
      {!isNear && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-550 font-mono text-[9px] bg-slate-950/20 select-none">
          Page {pageNum} (Scroll to load)
        </div>
      )}
      
      {isNear && (
        <>
          {!isVisible && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-[10px]">
              Page {pageNum} (Scroll to render)
            </div>
          )}
          
          <canvas ref={canvasRef} className="absolute inset-0 animate-fade-in" />

          {/* SVG Vector Annotations Layer */}
          {isVisible && (
            <svg
              ref={svgRef}
              className="absolute inset-0 z-10"
              style={{ cursor: drawMode !== "pointer" ? "crosshair" : "text" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleDrawHighlight}
            >
              {/* Render highlights */}
              {highlights.map((h) => (
                <rect
                  key={h.id}
                  x={h.x}
                  y={h.y}
                  width={h.w || 100}
                  height={h.h || 20}
                  fill={h.color || "#fef08a"}
                  opacity="0.35"
                  className="pointer-events-none"
                />
              ))}

              {/* Render annotations drawings */}
              {annotations.map((anno) => {
                const renderAnno = dragPreview && dragPreview.id === anno.id ? dragPreview : anno;

                if (anno.type === "freehand" && renderAnno.path) {
                  return (
                    <path
                      key={anno.id}
                      d={renderAnno.path.replace(/([MLQ])\s*([\d.-]+)\s+([\d.-]+)/g, (_: string, cmd: string, px: string, py: string) => {
                        return `${cmd} ${parseFloat(px) * zoomLevel} ${parseFloat(py) * zoomLevel}`;
                      })}
                      stroke={renderAnno.color}
                      strokeWidth={(renderAnno.thickness || 2) * zoomLevel}
                      fill="none"
                      style={{ cursor: "pointer", pointerEvents: "visibleStroke" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedAnnoId(anno.id);
                        setActiveMoveId(anno.id);
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                  );
                }

                if (anno.type === "rect") {
                  return (
                    <rect
                      key={anno.id}
                      x={renderAnno.x * zoomLevel}
                      y={renderAnno.y * zoomLevel}
                      width={renderAnno.w * zoomLevel}
                      height={renderAnno.h * zoomLevel}
                      stroke={renderAnno.color}
                      strokeWidth={(renderAnno.thickness || 2) * zoomLevel}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedAnnoId(anno.id);
                        setActiveMoveId(anno.id);
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                  );
                }

                if (anno.type === "circle") {
                  return (
                    <ellipse
                      key={anno.id}
                      cx={(renderAnno.x + renderAnno.w / 2) * zoomLevel}
                      cy={(renderAnno.y + renderAnno.h / 2) * zoomLevel}
                      rx={(renderAnno.w / 2) * zoomLevel}
                      ry={(renderAnno.h / 2) * zoomLevel}
                      stroke={renderAnno.color}
                      strokeWidth={(renderAnno.thickness || 2) * zoomLevel}
                      fill="transparent"
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedAnnoId(anno.id);
                        setActiveMoveId(anno.id);
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                  );
                }

                if (anno.type === "arrow") {
                  return (
                    <line
                      key={anno.id}
                      x1={renderAnno.x * zoomLevel}
                      y1={renderAnno.y * zoomLevel}
                      x2={renderAnno.x2 * zoomLevel}
                      y2={renderAnno.y2 * zoomLevel}
                      stroke={renderAnno.color}
                      strokeWidth={(renderAnno.thickness || 2) * zoomLevel}
                      style={{ cursor: "pointer" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedAnnoId(anno.id);
                        setActiveMoveId(anno.id);
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                  );
                }

                return null;
              })}

              {/* Draw active shape preview */}
              {isDrawing && drawShapePreview && (
                <rect
                  x={drawShapePreview.x * zoomLevel}
                  y={drawShapePreview.y * zoomLevel}
                  width={drawShapePreview.w * zoomLevel}
                  height={drawShapePreview.h * zoomLevel}
                  stroke={drawColor}
                  strokeWidth={drawThickness * zoomLevel}
                  fill="transparent"
                  className="pointer-events-none"
                />
              )}

              {/* Draw active line preview */}
              {isDrawing && drawLinePreview && (
                <line
                  x1={drawLinePreview.x1 * zoomLevel}
                  y1={drawLinePreview.y1 * zoomLevel}
                  x2={drawLinePreview.x2 * zoomLevel}
                  y2={drawLinePreview.y2 * zoomLevel}
                  stroke={drawColor}
                  strokeWidth={drawThickness * zoomLevel}
                  className="pointer-events-none"
                />
              )}

              {/* Draw active path */}
              {isDrawing && currentPath && (
                <path
                  d={currentPath.replace(/([MLQ])\s*([\d.-]+)\s+([\d.-]+)/g, (_: string, cmd: string, px: string, py: string) => {
                    return `${cmd} ${parseFloat(px) * zoomLevel} ${parseFloat(py) * zoomLevel}`;
                  })}
                  stroke={drawColor}
                  strokeWidth={drawThickness * zoomLevel}
                  fill="none"
                  className="pointer-events-none"
                />
              )}

              {/* Render resize handles for selection */}
              {selectedAnnoId && selectedAnno && selectedAnno.x !== undefined && selectedAnno.w !== undefined && (() => {
                const renderAnno = dragPreview && dragPreview.id === selectedAnno.id ? dragPreview : selectedAnno;
                const ax = renderAnno.x * zoomLevel;
                const ay = renderAnno.y * zoomLevel;
                const aw = renderAnno.w * zoomLevel;
                const ah = renderAnno.h * zoomLevel;

                return (
                  <g>
                    <rect
                      x={ax - 4}
                      y={ay - 4}
                      width={aw + 8}
                      height={ah + 8}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={ax - 8}
                      y={ay - 8}
                      width="8"
                      height="8"
                      fill="#8B5CF6"
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveResizeId(selectedAnno.id);
                        setResizeDirection("tl");
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                    <rect
                      x={ax + aw}
                      y={ay - 8}
                      width="8"
                      height="8"
                      fill="#8B5CF6"
                      style={{ cursor: "nesw-resize" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveResizeId(selectedAnno.id);
                        setResizeDirection("tr");
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                    <rect
                      x={ax - 8}
                      y={ay + ah}
                      width="8"
                      height="8"
                      fill="#8B5CF6"
                      style={{ cursor: "nesw-resize" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveResizeId(selectedAnno.id);
                        setResizeDirection("bl");
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                    <rect
                      x={ax + aw}
                      y={ay + ah}
                      width="8"
                      height="8"
                      fill="#8B5CF6"
                      style={{ cursor: "nwse-resize" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveResizeId(selectedAnno.id);
                        setResizeDirection("br");
                        setStartPos(getMouseCoords(e));
                      }}
                    />
                  </g>
                );
              })()}
            </svg>
          )}

          {/* Render Text Node inputs absolute positioned */}
          {isVisible && annotations.filter(a => a.type === "text").map(anno => {
            const renderAnno = dragPreview && dragPreview.id === anno.id ? dragPreview : anno;
            return (
              <div
                key={anno.id}
                style={{
                  position: "absolute",
                  left: `${renderAnno.x * zoomLevel}px`,
                  top: `${renderAnno.y * zoomLevel}px`,
                  color: renderAnno.color,
                  fontSize: `${(renderAnno.fontSize || 12) * zoomLevel}px`,
                  fontFamily: "monospace",
                  zIndex: 20,
                  cursor: drawMode === "pointer" ? "move" : "text",
                  border: selectedAnnoId === anno.id ? "1px dashed #8B5CF6" : "none",
                  padding: "2px",
                  display: "inline-block",
                  boxSizing: "border-box"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (drawMode === "pointer") {
                    setSelectedAnnoId(anno.id);
                  }
                }}
                onMouseDown={(e) => {
                  if (drawMode === "pointer" && e.target !== e.currentTarget.querySelector("input")) {
                    e.stopPropagation();
                    setSelectedAnnoId(anno.id);
                    setActiveMoveId(anno.id);
                    setStartPos(getMouseCoords(e as any));
                  }
                }}
              >
                <input
                  type="text"
                  value={renderAnno.text || ""}
                  onChange={(e) => {
                    onUpdateAnnotation({ ...anno, text: e.target.value });
                  }}
                  className="bg-transparent border-0 outline-none text-inherit font-inherit p-0 font-bold"
                  style={{ width: `${Math.max(120, (renderAnno.text || "").length * 8) * zoomLevel}px` }}
                  disabled={drawMode !== "pointer"}
                />
              </div>
            );
          })}

          {/* Floating page index indicator tag */}
          <span className="absolute bottom-3.5 right-3.5 bg-slate-950/80 border border-white/5 text-[9px] font-mono text-slate-405 font-bold px-2 py-0.5 rounded z-20 pointer-events-none">
            p. {pageNum}
          </span>
        </>
      )}
    </div>
  );
};
