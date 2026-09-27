import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationsContext";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

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

  const [viewMode, setViewMode] = useState<"calendar" | "agenda" | "timeline">("calendar");

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    
    const daysArr = [];
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
    exam: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    assignment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    study: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    other: "bg-slate-500/10 text-slate-400 border-slate-500/20"
  };

  const priorityIconMap = {
    high: <Flag className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />,
    medium: <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />,
    low: <Flag className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Organize assignments, exams, and milestones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
              </div>
              {viewMode === "calendar" ? (
                <span className="text-lg font-bold text-white">
                  {currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
                </span>
              ) : (
                <span className="text-lg font-bold text-white capitalize">{viewMode} View</span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {viewMode === "calendar" && (
                <div className="flex gap-2 bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-1">
                {["calendar", "agenda", "timeline"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      viewMode === mode
                        ? "bg-white/[0.05] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewMode === "calendar" && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-24 bg-[#0a0a12]/50 rounded-xl border border-transparent" />;
                  }
                  
                  const dayTasks = getTasksForDate(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={day.toISOString()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDayCellDrop(e, day)}
                      className={`h-24 p-2 rounded-xl border flex flex-col gap-1 overflow-hidden transition-all ${
                        isToday
                          ? "border-purple-500/50 bg-purple-500/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                          : "border-white/[0.06] bg-[#0f0f1a] hover:border-purple-500/30"
                      }`}
                    >
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md self-start ${
                        isToday 
                          ? "bg-purple-500 text-white" 
                          : "text-slate-400"
                      }`}>
                        {day.getDate()}
                      </span>

                      <div className="flex flex-col gap-1 overflow-y-auto scrollbar-none">
                        {dayTasks.map((t) => (
                          <div
                            key={t._id}
                            draggable
                            onDragStart={(e) => handleTaskDragStart(e, t._id)}
                            className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium cursor-grab active:cursor-grabbing ${categoryColorMap[t.category]} ${t.is_completed ? "line-through opacity-50" : ""}`}
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
                <div className="text-center py-12 text-sm text-slate-500">No agenda tasks scheduled.</div>
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
                    <div key={group} className="space-y-3">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">{group}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupTasks.map((task) => {
                          const isRecurring = task.description?.includes("[Recurring:");
                          const cleanDesc = task.description?.replace(/\[Recurring:\s*\w+\]/, "").trim();
                          
                          return (
                            <div key={task._id} className="p-4 rounded-xl border border-white/[0.06] bg-[#0f0f1a] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-4">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1.5 min-w-0">
                                  <h5 className={`text-sm font-semibold truncate ${task.is_completed ? "line-through text-slate-500" : "text-white"}`}>{task.title}</h5>
                                  {cleanDesc && <p className="text-xs text-slate-400 line-clamp-2">{cleanDesc}</p>}
                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className="text-[10px] text-slate-500">{new Date(task.start_date).toLocaleDateString()}</span>
                                    {isRecurring && (
                                      <span className="text-[10px] font-medium text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                        <Sparkles className="w-3 h-3" /> Recurring
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-md border uppercase font-semibold ${categoryColorMap[task.category]}`}>{task.category}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
                                <span className="flex items-center gap-1.5">{priorityIconMap[task.priority]} Priority</span>
                                <input
                                  type="checkbox"
                                  checked={task.is_completed}
                                  onChange={() => handleToggleComplete(task._id, task.is_completed)}
                                  className="w-4 h-4 rounded border-white/[0.06] bg-[#0a0a12] text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0 cursor-pointer"
                                />
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
            <div className="relative pl-6 border-l-2 border-white/[0.06] space-y-6 py-2 ml-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">No scheduled tasks.</div>
              ) : (
                [...tasks]
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((task) => {
                    const isRecurring = task.description?.includes("[Recurring:");
                    const cleanDesc = task.description?.replace(/\[Recurring:\s*\w+\]/, "").trim();
                    
                    return (
                      <div key={task._id} className="relative group">
                        <span className="absolute -left-[31px] top-4 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-[#161625]" />
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-[#0f0f1a] hover:border-purple-500/30 transition-all space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-400">{new Date(task.start_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                              <h4 className={`text-base font-bold ${task.is_completed ? "text-slate-500 line-through" : "text-white"}`}>{task.title}</h4>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-md border uppercase font-semibold ${categoryColorMap[task.category]}`}>{task.category}</span>
                          </div>
                          {cleanDesc && <p className="text-sm text-slate-400">{cleanDesc}</p>}
                          <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                            <span className="flex items-center gap-1.5 text-xs text-slate-400">Priority: {priorityIconMap[task.priority]}</span>
                            <div className="flex items-center gap-3">
                              {isRecurring && (
                                <span className="text-xs font-medium text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md">
                                  <Sparkles className="w-3 h-3" /> Recurring
                                </span>
                              )}
                              <input
                                type="checkbox"
                                checked={task.is_completed}
                                onChange={() => handleToggleComplete(task._id, task.is_completed)}
                                className="w-4 h-4 rounded border-white/[0.06] bg-[#0a0a12] text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0 cursor-pointer"
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

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <h4 className="text-lg font-bold text-white mb-4">Schedule Task</h4>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Task Title (e.g. Midterm Physics)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none"
                  required
                />
              </div>

              <div>
                <textarea
                  placeholder="Short details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none"
                  >
                    <option value="study">Study</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500/50 outline-none"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Schedule Task
              </button>
            </form>
          </div>

          <div className="bg-[#161625] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <h4 className="text-lg font-bold text-white mb-4">Pending Tasks</h4>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No pending tasks.
                </div>
              ) : (
                tasks.map((task) => {
                  const isRecurring = task.description?.includes("[Recurring:");
                  
                  return (
                    <div key={task._id} className="flex items-start justify-between p-3 rounded-xl border border-white/[0.06] bg-[#0f0f1a] gap-3 group transition-all hover:border-purple-500/30">
                      <div className="flex items-start gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={() => handleToggleComplete(task._id, task.is_completed)}
                          className="w-4 h-4 rounded border-white/[0.06] bg-[#0a0a12] text-purple-500 focus:ring-purple-500/20 focus:ring-offset-0 cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className={`text-sm font-semibold truncate ${task.is_completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                            {task.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {new Date(task.start_date).toLocaleDateString()}
                            </span>
                            {isRecurring && (
                              <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span title={`${task.priority} Priority`}>
                          {priorityIconMap[task.priority]}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </motion.div>
  );
};
