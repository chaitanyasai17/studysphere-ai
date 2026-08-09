import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  priority: "low" | "medium" | "high";
  category: "exam" | "assignment" | "study" | "other";
  is_completed: boolean;
}

export const Planner: React.FC = () => {
  const { addToast } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Planner Views State
  const [viewMode, setViewMode] = useState<"calendar" | "agenda" | "timeline">("calendar");

  // New task inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState<"exam" | "assignment" | "study" | "other">("study");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadTasks = async () => {
    try {
      const res = await api.get("/api/planner/tasks");
      setTasks(res.data);
    } catch (e) {
      addToast("Error", "Could not synchronize planner database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    let finalDescription = description;
    if (recurrence !== "none") {
      finalDescription = `${description} [Recurring: ${recurrence}]`;
    }

    try {
      const res = await api.post("/api/planner/tasks", {
        title,
        description: finalDescription,
        start_date: startDate,
        priority,
        category
      });
      addToast("Scheduled", `Task: ${title} created.`, "success");
      setTasks((prev) => [...prev, res.data]);
      
      // Clear form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("study");
      setRecurrence("none");
    } catch (err) {
      addToast("Failed", "Could not create study task.", "error");
    }
  };

  const handleToggleComplete = async (taskId: string, currentVal: boolean) => {
    try {
      await api.put(`/api/planner/tasks/${taskId}`, {
        is_completed: !currentVal
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, is_completed: !currentVal } : t))
      );
      addToast(
        "Updated",
        !currentVal ? "Task complete! Logged +0.5 study hours." : "Task updated.",
        "success"
      );
    } catch (e) {
      addToast("Error", "Could not update task.", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/api/planner/tasks/${taskId}`);
      addToast("Deleted", "Task deleted successfully.", "success");
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (e) {
      addToast("Error", "Could not delete task.", "error");
    }
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDayCellDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    
    const formattedDate = targetDate.toISOString().split("T")[0];
    try {
      await api.put(`/api/planner/tasks/${taskId}`, {
        start_date: formattedDate
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, start_date: formattedDate } : t))
      );
      addToast("Rescheduled", `Task moved to ${targetDate.toLocaleDateString()}`, "success");
    } catch (err) {
      addToast("Error", "Could not reschedule task.", "error");
    }
  };

  // Calendar math calculations
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    
    const daysArr = [];
    // Pad initial week days
    const firstDayIndex = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      daysArr.push(null);
    }
    
    for (let d = 1; d <= days; d++) {
      daysArr.push(new Date(year, month, d));
    }
    return daysArr;
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const offset = direction === "prev" ? -1 : 1;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const getTasksForDate = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    return tasks.filter((t) => t.start_date === formatted);
  };

  const categoryColorMap = {
    exam: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    assignment: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    study: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    other: "bg-slate-500/10 text-slate-550 border-slate-500/20"
  };

  const priorityIconMap = {
    high: <Flag className="w-3 h-3 text-rose-500 fill-rose-500" />,
    medium: <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />,
    low: <Flag className="w-3 h-3 text-slate-400 fill-slate-400" />
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Overview stats header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Study Planner</h1>
          <p className="text-xs text-slate-500">Organize assignments, exams, and milestones.</p>
        </div>
      </div>

      {/* Main planner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-6">
          <div className="flex justify-between items-center select-none flex-wrap gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              {viewMode === "calendar" ? (
                <span className="text-sm font-bold text-slate-200">
                  {currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
                </span>
              ) : (
                <span className="text-sm font-bold text-slate-200 capitalize">{viewMode} View</span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {viewMode === "calendar" && (
                <div className="flex gap-1.5 border border-white/5 rounded-xl p-0.5 bg-[#181922]">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-455 hover:text-white cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="p-1.5 rounded-lg hover:bg-slate-800/40 text-slate-455 hover:text-white cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              <div className="flex bg-[#181922] border border-white/5 rounded-xl p-0.5">
                {["calendar", "agenda", "timeline"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      viewMode === mode
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-455 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === "calendar" && (
            <div className="space-y-6">
              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-455 uppercase tracking-widest">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-20 bg-[#161720]/20 rounded-xl border border-transparent" />;
                  }
                  
                  const dayTasks = getTasksForDate(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={day.toISOString()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDayCellDrop(e, day)}
                      className={`h-20 p-2 rounded-xl border flex flex-col justify-between overflow-hidden transition-colors ${
                        isToday
                          ? "border-indigo-650 bg-indigo-500/5 shadow-inner"
                          : "border-white/5 bg-[#161720]/40 hover:bg-slate-800/10"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isToday 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 animate-pulse-slow" 
                          : "text-slate-500"
                      }`}>
                        {day.getDate()}
                      </span>

                      {/* Tasks inside day cell */}
                      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-12 scrollbar-none">
                        {dayTasks.map((t) => (
                          <div
                            key={t._id}
                            draggable
                            onDragStart={(e) => handleTaskDragStart(e, t._id)}
                            className={`text-[8px] px-1.5 py-0.5 rounded-lg border truncate capitalize font-bold transition-all cursor-grab active:cursor-grabbing ${categoryColorMap[t.category]} ${t.is_completed ? "line-through opacity-50" : ""}`}
                            title={t.title}
                          >
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "agenda" && (
            <div className="space-y-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">No agenda tasks scheduled.</div>
              ) : (
                ["Today", "Tomorrow", "Upcoming"].map((group) => {
                  let groupTasks = [];
                  const todayStr = new Date().toISOString().split("T")[0];
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split("T")[0];
                  
                  if (group === "Today") {
                    groupTasks = tasks.filter(t => t.start_date === todayStr);
                  } else if (group === "Tomorrow") {
                    groupTasks = tasks.filter(t => t.start_date === tomorrowStr);
                  } else {
                    groupTasks = tasks.filter(t => t.start_date !== todayStr && t.start_date !== tomorrowStr);
                  }
                  
                  if (groupTasks.length === 0) return null;
                  
                  return (
                    <div key={group} className="space-y-2">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{group}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groupTasks.map((task) => {
                          const isRecurring = task.description?.includes("[Recurring:");
                          const cleanDesc = task.description?.replace(/\[Recurring:\s*\w+\]/, "").trim();
                          
                          return (
                            <div key={task._id} className="p-4 rounded-2xl border border-white/5 bg-[#181922] hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h5 className={`text-xs font-bold ${task.is_completed ? "line-through text-slate-555" : "text-slate-200"}`}>{task.title}</h5>
                                  {cleanDesc && <p className="text-[10px] text-slate-400 leading-normal">{cleanDesc}</p>}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[8px] font-mono text-slate-500">{new Date(task.start_date).toLocaleDateString()}</span>
                                    {isRecurring && (
                                      <span className="text-[8px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/5 px-1.5 py-0.5 rounded">
                                        <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Recurring
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-[8.5px] px-2 py-0.5 rounded-lg border uppercase font-bold tracking-wide ${categoryColorMap[task.category]}`}>{task.category}</span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-white/5 pt-2">
                                <span className="flex items-center gap-1">{priorityIconMap[task.priority]} Priority</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={task.is_completed}
                                    onChange={() => handleToggleComplete(task._id, task.is_completed)}
                                    className="rounded text-indigo-650 bg-slate-900 border-white/5 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {viewMode === "timeline" && (
            <div className="relative pl-6 border-l border-white/10 space-y-6 py-2">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">No scheduled tasks.</div>
              ) : (
                [...tasks]
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((task) => {
                    const isRecurring = task.description?.includes("[Recurring:");
                    const cleanDesc = task.description?.replace(/\[Recurring:\s*\w+\]/, "").trim();
                    
                    return (
                      <div key={task._id} className="relative group">
                        <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-[#12131A]" />
                        <div className="p-4 rounded-2xl border border-white/5 bg-[#181922] hover:border-indigo-500/30 transition-all space-y-2 relative">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">{new Date(task.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                              <h4 className="text-xs font-bold text-slate-205">{task.title}</h4>
                            </div>
                            <span className={`text-[8.5px] px-2 py-0.5 rounded-lg border uppercase font-bold tracking-wide ${categoryColorMap[task.category]}`}>{task.category}</span>
                          </div>
                          {cleanDesc && <p className="text-[10px] text-slate-400 leading-normal">{cleanDesc}</p>}
                          <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[9px] text-slate-500">
                            <span className="flex items-center gap-1">Priority: {priorityIconMap[task.priority]}</span>
                            <div className="flex items-center gap-2">
                              {isRecurring && (
                                <span className="text-[8px] font-bold text-amber-500 flex items-center gap-0.5 bg-amber-500/5 px-1.5 py-0.5 rounded">
                                  <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Recurring
                                </span>
                              )}
                              <input
                                type="checkbox"
                                checked={task.is_completed}
                                onChange={() => handleToggleComplete(task._id, task.is_completed)}
                                className="rounded text-indigo-655 bg-slate-900 border-white/5 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>

        {/* Task builder and sidebar list (Right 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Create Task Form */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Schedule Task</h4>
            
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Task Title (e.g. Midterm Physics)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="premium-input w-full text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <textarea
                  placeholder="Short details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="premium-input w-full resize-none !h-16 text-[10px] py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Target Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="premium-input w-full text-[10px] py-1.5"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="premium-input w-full text-[10px] py-1.5"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Category Tag</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="premium-input w-full text-[10px] py-1.5"
                  >
                    <option value="study">Study Session</option>
                    <option value="exam">Quiz / Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="other">Other Event</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="premium-input w-full text-[10px] py-1.5"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full premium-button-primary cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Schedule Item
              </button>
            </form>
          </div>

          {/* List of active tasks */}
          <div className="p-6 rounded-3xl border border-white/5 bg-[#12131A] shadow-xl space-y-4">
            <div className="flex justify-between items-center select-none">
              <h4 className="text-xs font-bold text-slate-205">Pending Agenda</h4>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Checked logs</span>
            </div>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 select-none">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-slate-500">
                  Agenda list is empty.
                </div>
              ) : (
                tasks.map((task) => {
                  const isRecurring = task.description?.includes("[Recurring:");
                  
                  return (
                    <div key={task._id} className="flex items-start justify-between p-3 rounded-xl border border-white/5 bg-[#161720]/40 gap-3 group transition-all hover:border-indigo-500/20">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={() => handleToggleComplete(task._id, task.is_completed)}
                          className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-white/5 bg-slate-900 cursor-pointer mt-0.5"
                        />
                        <div className="min-w-0">
                          <h5 className={`text-xs font-bold truncate max-w-[150px] ${task.is_completed ? "line-through text-slate-500" : "text-slate-205"}`}>
                            {task.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-500 font-mono">
                              Due: {new Date(task.start_date).toLocaleDateString()}
                            </span>
                            {isRecurring && (
                              <span className="text-[8px] font-bold text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Repeat
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-center">
                        <span className="flex-shrink-0" title={`${task.priority} Priority`}>
                          {priorityIconMap[task.priority]}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1 rounded bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 cursor-pointer transition-all"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
