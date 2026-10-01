import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Menu, X, Mail, Globe, Code, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LandingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Home", id: "home", href: "/#home" },
    { label: "Features", id: "features", href: "/#features" },
    { label: "About", id: "about", href: "/#about" },
    { label: "Pricing", id: "pricing", href: "/#pricing" },
    { label: "Blog", id: "blog", href: "/#blog" }
  ];

  // Active section scroll spy & header background blur trigger
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sectionIds = ["home", "features", "about", "pricing", "blog"];
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(id);
            return;
          }
        }
      }
      setActiveSection("home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const isLandingRoute =
      location.pathname === "/" ||
      location.pathname === "/blog" ||
      location.pathname === "/pricing" ||
      location.pathname === "/about";

    if (!isLandingRoute) {
      navigate(`/#${sectionId}`);
      return;
    }

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveSection("home");
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", `#${sectionId}`);
      setActiveSection(sectionId);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
      setActiveSection("home");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col font-sans selection:bg-purple-500/30">
      {/* Navigation Header */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 h-[68px] ${
          isScrolled 
            ? "bg-[#0a0a12]/90 backdrop-blur-xl border-b border-purple-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
            : "bg-[#0a0a12]/60 backdrop-blur-md border-b border-white/[0.04]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex justify-start">
            <a 
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 group-hover:shadow-purple-500/40 transition-all duration-300">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-purple-200 transition-colors">
                  StudySphere AI
                </span>
                <span className="text-[9px] text-purple-400/80 -mt-1 font-mono tracking-wider uppercase font-semibold">
                  Intelligent Learning
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.id)}
                  className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-white bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.25)] border border-purple-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span 
                      layoutId="activePill"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex justify-end items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:text-white hover:border-purple-500/30 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[68px] z-40 bg-[#0c0c18]/95 backdrop-blur-2xl border-b border-purple-500/20 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? "bg-purple-500/20 text-white border border-purple-500/30 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
                  </a>
                );
              })}

              <div className="h-px w-full bg-white/[0.08] my-3" />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 px-4 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/25"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">{children}</main>

      {/* Premium SaaS Footer */}
      <footer className="bg-[#07070e] border-t border-white/[0.06] py-16 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 relative z-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-md shadow-purple-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                StudySphere AI
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The premier AI-powered learning and skill-building ecosystem. Accelerate your career with adaptive tutoring, interactive coding playgrounds, and real-time interview simulations.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://studysphere.ai" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-colors"
                title="Global Network"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com/chaitanyasai17/studysphere-ai" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-colors"
                title="GitHub Repository"
              >
                <Code className="w-4 h-4" />
              </a>
              <a 
                href="mailto:support@studysphere.ai" 
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-purple-300 hover:border-purple-500/40 transition-colors"
                title="Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase text-[11px] text-slate-300">Product</h5>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/#features" 
                  onClick={(e) => handleNavClick(e, "features")}
                  className="text-sm text-slate-400 hover:text-purple-300 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="/#pricing" 
                  onClick={(e) => handleNavClick(e, "pricing")}
                  className="text-sm text-slate-400 hover:text-purple-300 transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/ai" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  AI Tutor
                </Link>
              </li>
              <li>
                <Link to="/coding" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Coding Practice
                </Link>
              </li>
              <li>
                <Link to="/cybersecurity" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Cybersecurity Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase text-[11px] text-slate-300">Resources</h5>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/#blog" 
                  onClick={(e) => handleNavClick(e, "blog")}
                  className="text-sm text-slate-400 hover:text-purple-300 transition-colors"
                >
                  Blog & Articles
                </a>
              </li>
              <li>
                <a 
                  href="/#about" 
                  onClick={(e) => handleNavClick(e, "about")}
                  className="text-sm text-slate-400 hover:text-purple-300 transition-colors"
                >
                  About Platform
                </a>
              </li>
              <li>
                <Link to="/notes" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Smart Notes
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Quiz Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase text-[11px] text-slate-300">Account</h5>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <a href="mailto:support@studysphere.ai" className="text-sm text-slate-400 hover:text-purple-300 transition-colors">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 mt-14 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} StudySphere AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
