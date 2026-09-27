import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Menu, X, Mail, Globe, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LandingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Blog", href: "#blog" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/[0.04] h-[64px]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex justify-start">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                StudySphere AI
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-300 font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex justify-end items-center gap-6">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-[64px] z-40 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-white/[0.04] p-6 shadow-2xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px w-full bg-white/[0.04] my-2" />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white transition-colors py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
              >
                Get Started
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">{children}</main>

      {/* Premium Footer */}
      <footer className="bg-[#080810] border-t border-white/[0.04] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                StudySphere AI
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              The premium AI-powered learning platform designed for ambitious students and professionals to accelerate their growth.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-500 hover:text-purple-400 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-purple-400 transition-colors">
                <Code className="w-5 h-5" />
              </a>
              <a href="mailto:support@studysphere.ai" className="text-slate-500 hover:text-purple-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-6">Product</h5>
            <ul className="space-y-4">
              <li><a href="#features" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Pricing</a></li>
              <li><a href="#use-cases" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Use Cases</a></li>
              <li><a href="#changelog" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-6">Resources</h5>
            <ul className="space-y-4">
              <li><a href="#documentation" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Documentation</a></li>
              <li><a href="#api" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">API Reference</a></li>
              <li><a href="#community" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Community</a></li>
              <li><a href="#blog" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-6">Legal</h5>
            <ul className="space-y-4">
              <li><a href="#privacy" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Terms of Service</a></li>
              <li><a href="#security" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Security</a></li>
              <li><a href="#cookies" className="text-sm text-slate-500 hover:text-purple-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} StudySphere AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              System Status: Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
