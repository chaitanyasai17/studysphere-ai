import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context Providers
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationsProvider, useNotifications } from "./contexts/NotificationsContext";
import { cancelAllPendingRequests } from "./services/api";

// Layouts
import { LandingLayout } from "./layouts/LandingLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Components
import { CommandPalette } from "./components/CommandPalette";
import { ToastContainer } from "./components/ToastContainer";

// Pages (Lazy Loaded for performance optimization & code splitting)
const LandingPage = React.lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const EmailVerificationPage = React.lazy(() => import("./pages/EmailVerificationPage").then(m => ({ default: m.EmailVerificationPage })));
const Dashboard = React.lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const AITutor = React.lazy(() => import("./pages/AITutor").then(m => ({ default: m.AITutor })));
const Notes = React.lazy(() => import("./pages/Notes").then(m => ({ default: m.Notes })));
const PDFModule = React.lazy(() => import("./pages/PDFModule").then(m => ({ default: m.PDFModule })));
const Quiz = React.lazy(() => import("./pages/Quiz").then(m => ({ default: m.Quiz })));
const Flashcards = React.lazy(() => import("./pages/Flashcards").then(m => ({ default: m.Flashcards })));
const Planner = React.lazy(() => import("./pages/Planner").then(m => ({ default: m.Planner })));
const CodingPractice = React.lazy(() => import("./pages/Coding").then(m => ({ default: m.CodingPractice })));
const ResumeAssistant = React.lazy(() => import("./pages/Resume").then(m => ({ default: m.ResumeAssistant })));
const ProgressAnalytics = React.lazy(() => import("./pages/Analytics").then(m => ({ default: m.ProgressAnalytics })));
const AdminPanel = React.lazy(() => import("./pages/Admin").then(m => ({ default: m.AdminPanel })));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const Profile = React.lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Cybersecurity = React.lazy(() => import("./pages/Cybersecurity").then(m => ({ default: m.Cybersecurity })));

const queryClient = new QueryClient();

// Route Guard: Protected Student dashboard routes
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B12]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-indigo-650/10 border border-indigo-500/20 flex items-center justify-center text-3xl animate-float-robot">
            🔮
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-550 font-mono">Initializing Systems...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

const AdminRedirector: React.FC = () => {
  const { addToast } = useNotifications();
  
  useEffect(() => {
    addToast("Access Denied", "You do not have permission to access this page.", "error");
  }, [addToast]);

  return <Navigate to="/dashboard" replace />;
};

// Route Guard: Restrict to administrators only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B12]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl animate-float-robot">
            🛡️
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-550 font-mono">Securing Link...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const adminRoles = ["superadmin", "admin", "moderator", "support"];
  if (!adminRoles.includes(user.role)) {
    return <AdminRedirector />;
  }

  return <>{children}</>;
};

const OfflineBanner: React.FC = () => {
  const { isOnline } = useAuth();
  if (isOnline) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-[10.5px] text-amber-400 flex items-center justify-center gap-2 font-bold z-[9999] relative backdrop-blur-md animate-fade-in select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
      <span>You're offline. Changes requiring the server are temporarily unavailable.</span>
    </div>
  );
};

const NavigationRequestCanceler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    cancelAllPendingRequests();
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NavigationRequestCanceler />
        <ThemeProvider>
          <AuthProvider>
            <OfflineBanner />
            <NotificationsProvider>
              
              {/* Global search command palette & Toast notifications container */}
              <CommandPalette />
              <ToastContainer />

              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-[#0B0B12]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-650/10 border border-indigo-500/20 flex items-center justify-center text-3xl animate-float-robot animate-pulse">
                      🔮
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 animate-pulse">Loading Module...</span>
                  </div>
                </div>
              }>
                <Routes>
                  {/* Landing page routes */}
                  <Route
                    path="/"
                    element={
                      <LandingLayout>
                        <LandingPage />
                      </LandingLayout>
                    }
                  />

                  {/* Authentication routes */}
                  <Route
                    path="/login"
                    element={
                      <AuthLayout>
                        <LoginPage />
                      </AuthLayout>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <AuthLayout>
                        <RegisterPage />
                      </AuthLayout>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <AuthLayout>
                        <ForgotPasswordPage />
                      </AuthLayout>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <AuthLayout>
                        <ResetPasswordPage />
                      </AuthLayout>
                    }
                  />
                  <Route
                    path="/verify-email"
                    element={
                      <AuthLayout>
                        <EmailVerificationPage />
                      </AuthLayout>
                    }
                  />

                  {/* Protected Student Dashboard routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/ai" element={<AITutor />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/pdf" element={<PDFModule />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/planner" element={<Planner />} />
                    <Route path="/coding" element={<CodingPractice />} />
                    <Route path="/resume" element={<ResumeAssistant />} />
                    <Route path="/analytics" element={<ProgressAnalytics />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/cybersecurity" element={<Cybersecurity />} />
                  </Route>

                  {/* Protected Administrator panel routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </React.Suspense>

            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
