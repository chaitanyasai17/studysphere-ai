import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Menu, X, Mail } from "lucide-react";

export const LandingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Timeline", href: "#timeline" },
    { label: "Why Us", href: "#why-choose" },
    { label: "FAQ", href: "#faq" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] blur-blob bg-indigo-500/10 dark:bg-indigo-500/5 animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] blur-blob bg-sky-500/10 dark:bg-sky-500/5 animate-pulse-slow pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 glass w-full border-b border-slate-200/50 dark:border-slate-800/40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between md:grid md:grid-cols-3">
          <div className="flex justify-start">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-slate-900 to-indigo-700 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
                StudySphere AI
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex justify-center items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex justify-end items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-650 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-xs font-bold py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm pt-20">
          <div className="mx-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold py-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-650"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-100 dark:bg-slate-800 text-center rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-center rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-600/10"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow z-10">{children}</main>

      {/* Premium Footer */}
      <footer className="z-10 border-t border-slate-200/50 dark:border-slate-800/40 py-12 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                StudySphere AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
              Intelligent AI assistant platform empowering scholars to learn smarter, prepare for placement rounds, and build coding projects.
            </p>
            <div className="flex gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="mailto:support@studysphere.ai" className="hover:text-indigo-600 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Product</h5>
            <ul className="space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features</a></li>
              <li><a href="#timeline" className="hover:text-indigo-600 transition-colors">Timeline</a></li>
              <li><a href="#why-choose" className="hover:text-indigo-600 transition-colors">Why StudySphere</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Resources</h5>
            <ul className="space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">GitHub Repository</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Legal</h5>
            <ul className="space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Security Auditing</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200/50 dark:border-slate-800/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-400">
            &copy; {new Date().getFullYear()} StudySphere AI. All rights reserved. Built for engineering excellence.
          </p>
          <span className="text-[9px] text-slate-400">
            Current Server Location: India (bom)
          </span>
        </div>
      </footer>
    </div>
  );
};
