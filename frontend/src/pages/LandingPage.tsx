import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Sparkles,
  Play,
  ArrowRight,
  MessageSquare,
  BookOpen,
  FileText,
  HelpCircle,
  Code,
  Users,
  FileBadge,
  Shield,
  CheckCircle,
  TrendingUp,
  Cpu,
  Star,
  Globe,
  LayoutDashboard,
  FolderLock,
  Calendar,
  BarChart3,
  Lock,
  ShieldAlert,
  Check,
  Award,
  Zap,
  Flame,
  Clock,
  Target,
  Brain,
  Layers,
  GraduationCap,
  Building,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { VideoDemoModal } from "../components/landing/VideoDemoModal";
import { ArticleReaderModal, type BlogArticle } from "../components/landing/ArticleReaderModal";
import { ContactSalesModal } from "../components/landing/ContactSalesModal";

interface LandingPageProps {
  defaultSection?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ defaultSection }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [contactSalesOpen, setContactSalesOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  // Pricing billing cycle: monthly vs annual
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Smooth scroll to target section if provided via prop or URL hash
  useEffect(() => {
    const targetId = defaultSection || window.location.hash.replace("#", "");
    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [defaultSection]);

  const handleTryFeature = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate("/login", { state: { from: path } });
    }
  };

  const features = [
    {
      title: "AI Tutor",
      desc: "Get instant, personalized explanations and step-by-step guidance for complex topics.",
      icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
      color: "cyan",
      bgClass: "bg-cyan-500/10",
      borderHoverClass: "hover:border-cyan-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]",
      path: "/ai"
    },
    {
      title: "PDF Learning",
      desc: "Upload academic textbooks and query materials semantically with citations.",
      icon: <BookOpen className="w-6 h-6 text-blue-400" />,
      color: "blue",
      bgClass: "bg-blue-500/10",
      borderHoverClass: "hover:border-blue-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
      path: "/pdf"
    },
    {
      title: "Smart Notes",
      desc: "Organize your study thoughts with intelligent summarization and Markdown export.",
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      color: "emerald",
      bgClass: "bg-emerald-500/10",
      borderHoverClass: "hover:border-emerald-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
      path: "/notes"
    },
    {
      title: "Quiz Generator",
      desc: "Test your retention with auto-generated flashcards, custom timers, and instant scoring.",
      icon: <HelpCircle className="w-6 h-6 text-purple-400" />,
      color: "purple",
      bgClass: "bg-purple-500/10",
      borderHoverClass: "hover:border-purple-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
      path: "/quiz"
    },
    {
      title: "Coding Playground",
      desc: "Write, run, and debug code in multiple programming languages directly in your browser.",
      icon: <Code className="w-6 h-6 text-orange-400" />,
      color: "orange",
      bgClass: "bg-orange-500/10",
      borderHoverClass: "hover:border-orange-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]",
      path: "/coding"
    },
    {
      title: "Mock Interviews",
      desc: "Simulate real-time technical and behavioral interviews with tailored AI feedback.",
      icon: <Users className="w-6 h-6 text-pink-400" />,
      color: "pink",
      bgClass: "bg-pink-500/10",
      borderHoverClass: "hover:border-pink-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]",
      path: "/ai"
    },
    {
      title: "Resume Assistant",
      desc: "Score and optimize your resume for applicant tracking systems with keyword alignment.",
      icon: <FileBadge className="w-6 h-6 text-amber-400" />,
      color: "amber",
      bgClass: "bg-amber-500/10",
      borderHoverClass: "hover:border-amber-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]",
      path: "/resume"
    },
    {
      title: "Cybersecurity Lab",
      desc: "Safe sandbox environments to practice ethical hacking and security defense concepts.",
      icon: <Shield className="w-6 h-6 text-red-400" />,
      color: "red",
      bgClass: "bg-red-500/10",
      borderHoverClass: "hover:border-red-500/30",
      shadowHoverClass: "hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
      path: "/cybersecurity"
    }
  ];

  const blogArticles: BlogArticle[] = [
    {
      id: "ai-personalized-learning-2026",
      category: "AI Trends",
      title: "How AI is Revolutionizing Personalized Learning in 2026",
      description: "Discover how adaptive LLMs and cognitive scaffolding help learners master complex engineering subjects 40% faster.",
      date: "Oct 12, 2026",
      readTime: "5 min read",
      author: "Dr. Elena Vance, EdTech Researcher",
      paragraphs: [
        "Traditional education models have long suffered from a 'one-size-fits-all' bottleneck. In a typical university lecture or boot camp classroom, the instructor paces the curriculum to the median student. Fast learners experience stagnation and disengagement, while students needing foundational review fall progressively behind.",
        "With modern AI-driven tutoring architectures like StudySphere AI, learning shifts from static lecturing to active bidirectional dialog. Instead of merely feeding solutions, adaptive models observe where a student pauses, what errors appear in their code, and formulate tailored prompts that lead them to the breakthrough independently.",
        "Furthermore, multimodal context—such as ingesting entire lecture slide decks, syllabus outlines, and textbook PDFs simultaneously—enables the AI tutor to ground its explanations precisely in the course's terminology. The result is a 40% increase in conceptual retention and a profound reduction in study anxiety."
      ],
      keyTakeaways: [
        "Real-time adaptive feedback helps students retain concepts 40% faster than passive video watching.",
        "Conversational AI tutors bridge the gap between abstract theory and applied problem solving.",
        "Scaffolded hints prevent cognitive overload and foster independent critical thinking."
      ],
      featureLink: "/ai",
      featureLabel: "Try AI Tutor Now"
    },
    {
      id: "mastering-dsa-with-ai",
      category: "Coding & DSA",
      title: "Mastering Data Structures with AI-Assisted Problem Solving",
      description: "A battle-tested methodology for breaking down recursion, dynamic programming, and graph algorithms into intuitive mental models.",
      date: "Oct 08, 2026",
      readTime: "7 min read",
      author: "Marcus Chen, Senior SWE & Mentor",
      paragraphs: [
        "Data structures and algorithms (DSA) are the bedrock of computer science and technical hiring, yet millions of engineers find Dynamic Programming and Graph Traversals intimidating. The primary reason is that standard problem solutions present the final, optimized state without explaining the exploratory steps that produced it.",
        "StudySphere AI's Coding Playground changes this dynamic. When working through an algorithm problem, the AI can generate visual ASCII call trees for recursion, highlight variable state transitions after each loop, and execute the solution against edge cases in real-time.",
        "The winning strategy is to ask the AI for time/space complexity comparisons and subtle hints before looking at an answer. By treating the AI as a collaborative pair programmer rather than an answer oracle, students internalize reusable algorithmic patterns that translate effortlessly to technical interviews."
      ],
      keyTakeaways: [
        "Deconstructing recursion and dynamic programming using visual state transitions eliminates memorization.",
        "Browser-based sandboxes allow instant testing of edge cases without setting up local runtimes.",
        "Gradual hint prompting preserves authentic learning while keeping frustration at bay."
      ],
      featureLink: "/coding",
      featureLabel: "Open Coding Playground"
    },
    {
      id: "pdf-textbook-rag-guide",
      category: "Study Techniques",
      title: "The Ultimate Guide to Chatting with Textbooks using PDF RAG",
      description: "How semantic retrieval and vector embeddings turn 600-page academic documents into instant, interactive question-and-answer partners.",
      date: "Sep 29, 2026",
      readTime: "6 min read",
      author: "Sarah Jenkins, Learning Specialist",
      paragraphs: [
        "Reading a dense 600-page academic PDF often results in the illusion of competence: you highlight paragraphs, re-read pages, yet struggle to reproduce key formulas or definitions during an exam.",
        "Retrieval-Augmented Generation (RAG) completely reimagines textbook study. By segmenting documents into semantic chunks and indexing them with high-dimensional vector embeddings, StudySphere AI retrieves exact passages and generates contextual explanations with accurate page references.",
        "Rather than reading passively, you can prompt the platform: 'Explain Section 4.2 in the context of the homework problem on page 112,' or 'Generate a 10-question flashcard deck focusing strictly on the trade-offs discussed in Chapter 5.' This transforms reading into an active dialogue."
      ],
      keyTakeaways: [
        "Semantic search pinpoints precise textbook definitions in milliseconds across hundreds of pages.",
        "Active recall queries turn static chapters into interactive review sessions.",
        "Automatic citation indexing verifies that AI answers are grounded in your actual syllabus."
      ],
      featureLink: "/pdf",
      featureLabel: "Chat with Course PDFs"
    },
    {
      id: "cracking-tech-interviews-ai",
      category: "Career Prep",
      title: "Cracking Tech Interviews: Behavioral and System Design AI Strategies",
      description: "Structure STAR-method responses, simulate architectural trade-off discussions, and eliminate verbal crutches with mock simulations.",
      date: "Sep 22, 2026",
      readTime: "8 min read",
      author: "David Patel, Engineering Leader",
      paragraphs: [
        "Technical competence is only half the equation in engineering recruitment. Strong candidates frequently get rejected because they struggle to structure behavioral questions under pressure or fail to communicate trade-offs clearly during system design rounds.",
        "StudySphere AI simulates mock interviews by acting as an experienced engineering manager. It listens to your spoken or written responses, assesses them against the STAR framework (Situation, Task, Action, Result), and asks spontaneous follow-up questions tailored to your answer.",
        "After each simulation, the system provides an actionable score card: clarity of thought, quantitative impact mentioned, verbal fillers used, and alternative architectural solutions you could have proposed."
      ],
      keyTakeaways: [
        "The STAR methodology provides a reliable blueprint for concise, high-impact behavioral answers.",
        "Unpredictable AI follow-up questions replicate the authentic pressure of live hiring rounds.",
        "Immediate diagnostic feedback highlights gaps in communication before high-stakes interviews."
      ],
      featureLink: "/ai",
      featureLabel: "Launch Mock Interview"
    },
    {
      id: "cybersecurity-sandbox-defense",
      category: "Security",
      title: "Building a Cybersecurity Mindset: Hands-on Sandbox Labs",
      description: "Why interactive defense labs and offensive simulation are essential for developing practical security intuition and ethical hacking skills.",
      date: "Sep 15, 2026",
      readTime: "6 min read",
      author: "Aria Thorne, Offensive Security Analyst",
      paragraphs: [
        "Cybersecurity cannot be learned through multiple-choice questions alone. Understanding how SQL injection, Cross-Site Scripting (XSS), or authentication bypass vulnerabilities work requires observing them inside a running web application.",
        "StudySphere AI's Cybersecurity Lab offers sandboxed environments where students safely dissect attack surfaces. Learners can view the raw HTTP headers, experiment with payloads, and examine defensive countermeasures such as parameterized queries and Content Security Policies (CSP).",
        "By learning both offensive exploitation and defensive remediation side-by-side, students develop the proactive security mindset demanded by high-growth security teams and SOC environments."
      ],
      keyTakeaways: [
        "Isolated browser sandboxes provide safe ground for investigating real web vulnerabilities.",
        "Hands-on packet and payload inspection builds true intuition far beyond textbook memorization.",
        "Understanding defensive remediation makes you a significantly better software engineer."
      ],
      featureLink: "/cybersecurity",
      featureLabel: "Explore Cyber Lab"
    },
    {
      id: "beat-the-ats-resume-ai",
      category: "Career Prep",
      title: "How to Beat the ATS: Optimizing Your Resume with AI Keyword Match",
      description: "Modern Applicant Tracking Systems don't just count keywords—they score skill clusters and quantitative impact. Here is how to rank in the top 5%.",
      date: "Sep 04, 2026",
      readTime: "5 min read",
      author: "Rachel Gomez, Tech Recruiter",
      paragraphs: [
        "Over 75% of engineering resumes are filtered out by Applicant Tracking Systems before a human hiring manager ever glances at them. The mistake most applicants make is either 'keyword stuffing' or writing generic task descriptions like 'built frontend components with React.'",
        "Modern recruiting algorithms look for evidence of impact, scale, and modern tooling stacks. Your bullet points should reflect the XYZ formula: 'Accomplished [X] as measured by [Y] by doing [Z]'. For example: 'Reduced API latency by 45% (Y) across 100K daily active users (X) by implementing Redis caching and indexing MongoDB collections (Z).'",
        "StudySphere AI's Resume Assistant scans your resume against your target job description, identifying missing keywords, formatting errors, and weak bullet points to ensure your application gets directly into the recruiter's hands."
      ],
      keyTakeaways: [
        "Modern ATS algorithms reward quantified business and technical impact over vague duties.",
        "Semantic skill clustering ensures your tech stack matches the job specifications precisely.",
        "AI resume audits surface missing technical competencies before submitting applications."
      ],
      featureLink: "/resume",
      featureLabel: "Audit Your Resume"
    }
  ];

  return (
    <div className="bg-[#0a0a12] w-full min-h-screen overflow-hidden text-white font-sans">
      
      {/* 1. Hero Section */}
      <section 
        id="home" 
        className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-20 px-6 sm:px-8 scroll-mt-24"
      >
        {/* Subtle radial ambient glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs sm:text-sm font-medium shadow-[0_0_20px_rgba(168,85,247,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Next-Gen AI Learning & Skill Building Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.08] max-w-5xl"
          >
            Learn Smarter.<br />
            Build Skills.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400">
              Grow Faster.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            StudySphere AI combines personalized tutoring, live code execution, PDF comprehension, and interview readiness into one unified workspace built for ambitious students.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto"
          >
            <Link
              to="/register"
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setVideoModalOpen(true)}
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-purple-500/40 text-white rounded-2xl font-semibold transition-all duration-300 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-purple-300 text-purple-300 ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-6 flex flex-col items-center gap-3"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a12] bg-slate-800 flex items-center justify-center overflow-hidden shadow-md">
                  <img src={`https://i.pravatar.cc/100?img=${i + 12}`} alt="User avatar" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <span className="font-medium text-slate-300">Trusted by 10,000+ ambitious learners</span>
            </div>
          </motion.div>
        </div>

        {/* 4 Stat Cards Row */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative z-10 w-full max-w-7xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 px-4"
        >
          {[
            { label: "10K+ Active Students", sub: "Worldwide learners", icon: <Users className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/10" },
            { label: "50+ Learning Topics", sub: "From CS to Cybersecurity", icon: <BookOpen className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/10" },
            { label: "AI Personalized Learning", sub: "Adaptive comprehension", icon: <Cpu className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/10" },
            { label: "24/7 AI Availability", sub: "Real-time answers anytime", icon: <MessageSquare className="w-5 h-5 text-amber-400" />, bg: "bg-amber-500/10" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center p-6 bg-[#161625]/90 border border-white/[0.06] rounded-2xl shadow-lg hover:border-purple-500/30 transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-3 shadow-inner`}>
                {stat.icon}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white leading-tight">{stat.label}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-24 px-6 sm:px-8 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              Comprehensive Toolkit
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Everything You Need to Excel</h2>
            <p className="text-slate-400 text-base md:text-lg">
              A full suite of intelligent tools crafted to supercharge your academic understanding and technical career preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => handleTryFeature(feature.path)}
                className={`group bg-[#161625] border border-white/[0.06] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${feature.borderHoverClass} ${feature.shadowHoverClass} flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl ${feature.bgClass} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{feature.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 pt-2 border-t border-white/[0.04]">
                  <span>Explore Feature</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="py-24 px-6 sm:px-8 bg-[#0f0f1a] relative border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">How It Works</h2>
            <p className="text-slate-400 text-base md:text-lg">
              Your personalized journey from theory to industry-grade mastery in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            
            {[
              { step: "01", title: "Set Your Goals & Profile", desc: "Select your target computer science or engineering domains and outline your learning objectives.", icon: <CheckCircle className="w-6 h-6 text-purple-400" /> },
              { step: "02", title: "Learn with AI Assistance", desc: "Upload textbooks, chat with the AI tutor, generate adaptive quizzes, and practice coding.", icon: <Sparkles className="w-6 h-6 text-blue-400" /> },
              { step: "03", title: "Master Interviews & Skills", desc: "Build hands-on cybersecurity projects, simulate behavioral interviews, and track your analytics.", icon: <TrendingUp className="w-6 h-6 text-emerald-400" /> }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center space-y-4 z-10"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#161625] border-2 border-purple-500/30 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm max-w-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive Platform Preview Section */}
      <section id="platform-preview" className="py-28 px-6 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Live Interactive Interface
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">The Modern Learner's Workspace</h2>
            <p className="text-slate-400 text-base">Click around the dashboard below to experience the StudySphere interface.</p>
          </div>

          <motion.div
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-purple-500/30 bg-[#161625]/90 backdrop-blur-xl shadow-[0_0_70px_-15px_rgba(139,92,246,0.35),0_25px_50px_-12px_rgba(0,0,0,0.9)] p-2 sm:p-3 max-w-5xl mx-auto"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

            {/* Browser Window Mockup Frame */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a14] overflow-hidden flex flex-col relative z-20" style={{ height: 'clamp(460px, 58vw, 620px)' }}>
              {/* Browser Header */}
              <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e1a] flex items-center justify-between shrink-0">
                <div className="flex gap-2 items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 shadow-sm shadow-rose-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 shadow-sm shadow-amber-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 shadow-sm shadow-emerald-500/50" />
                </div>
                <div className="px-6 sm:px-12 md:px-24 py-1 rounded-lg bg-[#141424] border border-white/[0.06] text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">https://app.studysphere.ai</span>
                  <span className="relative flex h-2 w-2 shrink-0 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="w-10" />
              </div>
              
              {/* Dashboard Content — Interactive Mockup */}
              <div className="flex-1 flex min-h-0">
                {/* Sidebar Navigation */}
                <aside 
                  className="w-48 lg:w-52 border-r border-white/[0.06] bg-[#0c0c16] p-2.5 flex flex-col hidden sm:flex shrink-0 overflow-y-auto scrollbar-none relative z-20"
                  aria-label="Interactive preview sidebar"
                >
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-2.5 py-1.5 mb-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group relative z-30 flex-shrink-0"
                    title="StudySphere AI Dashboard"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight truncate">StudySphere AI</span>
                  </Link>

                  <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-none py-1">
                    {[
                      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
                      { name: "AI Tutor", path: "/ai", icon: MessageSquare },
                      { name: "Notes", path: "/notes", icon: FileText },
                      { name: "PDF Learning", path: "/pdf", icon: BookOpen },
                      { name: "Quiz Generator", path: "/quiz", icon: HelpCircle },
                      { name: "Flashcards", path: "/flashcards", icon: FolderLock },
                      { name: "Planner", path: "/planner", icon: Calendar },
                      { name: "Coding Practice", path: "/coding", icon: Code },
                      { name: "Cybersecurity Lab", path: "/cybersecurity", icon: ShieldAlert },
                      { name: "Resume Assistant", path: "/resume", icon: FileBadge },
                      { name: "Progress Analytics", path: "/analytics", icon: BarChart3 },
                      { name: "Admin Panel", path: "/admin", icon: Lock },
                    ].map((item, idx) => {
                      const isActive = idx === 0;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer relative z-30 group ${
                            isActive
                              ? "bg-purple-500/20 text-white border-l-2 border-purple-400 font-semibold shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                              : "text-slate-400 hover:text-white hover:bg-white/[0.04] border-l-2 border-transparent"
                          }`}
                          title={`Navigate to ${item.name}`}
                        >
                          <div className={`flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${isActive ? "text-purple-300" : ""}`}>
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate whitespace-nowrap">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-3.5 md:p-4 lg:p-5 bg-[#0a0a14] flex flex-col gap-3.5 overflow-y-auto min-w-0">
                  {/* Header Row */}
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-white tracking-tight">Welcome back, Chaitanya! 👋</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your intelligent learning dashboard</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[10px] font-semibold text-amber-300">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>14-day streak</span>
                      </div>
                      <Link 
                        to="/dashboard"
                        className="px-2.5 py-1 bg-gradient-to-r from-violet-600/30 via-purple-600/30 to-fuchsia-600/30 border border-purple-500/30 hover:border-purple-500/60 rounded-lg text-[10px] font-semibold text-purple-200 transition-colors shadow-sm cursor-pointer"
                        title="Pro Plan Status"
                      >
                        Pro Plan
                      </Link>
                    </div>
                  </div>
                  
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      { value: "12", label: "Topics Completed", color: "text-purple-300", bg: "bg-purple-500/15 border-purple-500/30", icon: BookOpen, badge: "+3 this wk", path: "/analytics" },
                      { value: "48", label: "Quizzes Taken", color: "text-blue-300", bg: "bg-blue-500/15 border-blue-500/30", icon: HelpCircle, badge: "94% avg", path: "/quiz" },
                      { value: "6", label: "Projects Built", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30", icon: Code, badge: "2 active", path: "/coding" },
                      { value: "3", label: "Certificates", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30", icon: Award, badge: "Verified", path: "/dashboard" },
                    ].map((stat) => (
                      <Link
                        key={stat.label}
                        to={stat.path}
                        className="bg-[#121220] border border-white/[0.06] hover:border-purple-500/40 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] hover:bg-[#161628] block shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.bg}`}>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 bg-white/[0.06] px-1.5 py-0.5 rounded-full">{stat.badge}</span>
                        </div>
                        <div className={`text-xl lg:text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.label}</div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Row — Continue Learning + Today's Goals */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
                    <div className="flex-1 bg-[#121220] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-400" />
                            Continue Learning
                          </h4>
                          <Link to="/coding" className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">View all →</Link>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: "Data Structures & Algorithms", topic: "Module 4: Graph Traversals", pct: 65, color: "bg-gradient-to-r from-violet-500 to-purple-500", icon: Code, iconBg: "bg-purple-500/15 text-purple-400", path: "/coding" },
                            { name: "Machine Learning Fundamentals", topic: "Neural Networks & Backprop", pct: 40, color: "bg-gradient-to-r from-blue-500 to-cyan-500", icon: Cpu, iconBg: "bg-blue-500/15 text-blue-400", path: "/ai" },
                            { name: "Web Development with React", topic: "State Management & Hooks", pct: 82, color: "bg-gradient-to-r from-emerald-500 to-teal-500", icon: Globe, iconBg: "bg-emerald-500/15 text-emerald-400", path: "/notes" },
                          ].map((course) => (
                            <Link 
                              key={course.name}
                              to={course.path}
                              className="block p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all group cursor-pointer"
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${course.iconBg}`}>
                                    <course.icon className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">{course.name}</div>
                                    <div className="text-[9px] text-slate-400 truncate">{course.topic}</div>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-200 shrink-0 ml-2">{course.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.pct}%` }} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Quick Tools Action Chips */}
                      <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                        <div className="text-[10px] font-semibold text-slate-400 mb-1.5">Quick Tools</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { label: "AI Tutor", path: "/ai", icon: MessageSquare, color: "text-purple-400" },
                            { label: "Upload PDF", path: "/pdf", icon: BookOpen, color: "text-blue-400" },
                            { label: "Instant Quiz", path: "/quiz", icon: HelpCircle, color: "text-pink-400" },
                            { label: "Code Arena", path: "/coding", icon: Code, color: "text-cyan-400" }
                          ].map((q) => (
                            <Link 
                              key={q.label} 
                              to={q.path}
                              className="px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:bg-purple-500/10 hover:border-purple-500/30 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 justify-center"
                            >
                              <q.icon className={`w-3 h-3 ${q.color}`} />
                              <span className="truncate">{q.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Today's Goals */}
                    <div className="w-full lg:w-56 xl:w-60 bg-[#121220] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between shrink-0">
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Today's Goals
                          </h4>
                          <Link to="/planner" className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors">Planner →</Link>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { task: "Complete AI Notes", done: true, time: "15m", path: "/notes" },
                            { task: "Take DSA Quiz", done: true, time: "20m", path: "/quiz" },
                            { task: "Practice Coding", done: false, time: "30m", path: "/coding" },
                            { task: "Read Cyber Article", done: false, time: "10m", path: "/cybersecurity" },
                          ].map((goal) => (
                            <Link 
                              key={goal.task}
                              to={goal.path}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${goal.done ? "bg-emerald-500 text-black shadow-sm shadow-emerald-500/50" : "border border-slate-600 group-hover:border-purple-400"}`}>
                                  {goal.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className={`text-xs ${goal.done ? "text-slate-400 line-through" : "text-white font-medium group-hover:text-purple-200"} truncate`}>{goal.task}</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-1.5">{goal.time}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* XP Progress Card */}
                      <Link 
                        to="/analytics"
                        className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors p-1"
                        title="View XP Analytics"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">1,250 XP</div>
                            <div className="text-[10px] text-amber-400/90 font-medium">Level 8 • Scholar</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full shrink-0">+150 XP</span>
                      </Link>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. About Section */}
      <section id="about" className="py-24 px-6 sm:px-8 bg-[#0d0d18] border-y border-white/[0.04] scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Our Mission & Philosophy
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Architected for Real Understanding
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">
              StudySphere AI eliminates educational fragmentation by bringing intelligent comprehension, sandboxed coding, and career simulation into one unified environment.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                pillar: "Pillar 01",
                title: "AI-Powered Learning",
                desc: "Adaptive tutoring with conversational context that breaks complex theoretical proofs and code logic down into clear, memorable mental models.",
                icon: <Brain className="w-6 h-6 text-violet-400" />,
                badge: "Deep Reasoning",
                points: ["Real-time Socratic hints", "PDF semantic RAG retrieval", "Instant concept quiz generation"]
              },
              {
                pillar: "Pillar 02",
                title: "Personalized Education",
                desc: "Every learner possesses unique strengths and gaps. StudySphere AI dynamically adjusts pacing, recommending review materials right when retention drops.",
                icon: <Target className="w-6 h-6 text-pink-400" />,
                badge: "Adaptive Pacing",
                points: ["Knowledge gap diagnostics", "Spaced repetition flashcards", "Personalized study milestone plans"]
              },
              {
                pillar: "Pillar 03",
                title: "Practical Skill Development",
                desc: "Theoretical knowledge without application evaporates quickly. We provide immediate hands-on coding sandboxes and interactive cybersecurity labs.",
                icon: <Code className="w-6 h-6 text-cyan-400" />,
                badge: "Active Coding",
                points: ["Multi-language execution (Python, JS, C++)", "Sandboxed vulnerability simulations", "Instant syntax & output feedback"]
              },
              {
                pillar: "Pillar 04",
                title: "Career & Interview Preparation",
                desc: "Bridging the gap between university coursework and high-paying engineering roles with AI recruiters, ATS resume audits, and portfolio trackers.",
                icon: <GraduationCap className="w-6 h-6 text-amber-400" />,
                badge: "Career Ready",
                points: ["AI-simulated technical & behavioral interviews", "ATS resume keyword scoring", "Verified achievement certificates"]
              }
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#141424] border border-white/[0.06] hover:border-purple-500/30 rounded-3xl p-8 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      {card.icon}
                    </div>
                    <span className="text-[11px] font-mono tracking-wider text-purple-400 font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                      {card.pillar}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{card.desc}</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/[0.04]">
                  {card.points.map((pt, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social Proof Strip */}
          <div className="bg-[#121222] border border-white/[0.06] rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">99.4%</div>
              <div className="text-xs text-slate-400 mt-1">Learner Satisfaction</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-400">10,000+</div>
              <div className="text-xs text-slate-400 mt-1">Registered Students</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</div>
              <div className="text-xs text-slate-400 mt-1">Average Course Rating</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">24 / 7</div>
              <div className="text-xs text-slate-400 mt-1">AI Tutor Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-24 px-6 sm:px-8 scroll-mt-24 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Transparent Pricing
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Invest in Your Future
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Start completely free and upgrade as your learning accelerates. No surprises, cancel anytime.
            </p>

            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-semibold ${billingCycle === "monthly" ? "text-white" : "text-slate-400"}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                className="w-14 h-7 rounded-full bg-purple-900/50 p-1 border border-purple-500/40 relative cursor-pointer transition-colors"
                aria-label="Toggle billing frequency"
              >
                <motion.div
                  animate={{ x: billingCycle === "monthly" ? 0 : 26 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 shadow-md"
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${billingCycle === "annual" ? "text-white" : "text-slate-400"}`}>
                  Annual
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Save 20%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-[#141424] border border-white/[0.06] rounded-3xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Starter Free</h3>
                  <p className="text-xs text-slate-400 mt-1">Core AI tools to kickstart your daily study routines</p>
                </div>

                <div className="py-4 border-y border-white/[0.06] my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">₹0</span>
                    <span className="text-xs text-slate-400">/ forever</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">No credit card required</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  {[
                    "15 AI Tutor queries / day",
                    "3 PDF textbook uploads (up to 10MB)",
                    "Basic browser code execution (Python, JS)",
                    "5 Quizzes & Flashcard decks",
                    "Smart Notes with markdown export",
                    "Standard community forum support"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full py-3.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-center text-xs font-semibold border border-white/[0.08] transition-all hover:scale-[1.02]"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Tier (Popular) */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#18182c] border-2 border-purple-500/50 rounded-3xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(139,92,246,0.25)] scale-100 md:scale-105 z-10"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md">
                Most Popular
              </div>

              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Pro Learner
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1">Unlimited AI capabilities and career prep tools</p>
                </div>

                <div className="py-4 border-y border-purple-500/20 my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {billingCycle === "monthly" ? "₹499" : "₹399"}
                    </span>
                    <span className="text-xs text-slate-300">/ month</span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 mt-1">
                    {billingCycle === "monthly" ? "Billed monthly" : "Billed annually at ₹4,788 (Save 20%)"}
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  {[
                    "Unlimited AI Tutor queries with fast response",
                    "Unlimited PDF uploads & multi-doc deep RAG",
                    "Full Coding Playground (all languages + debugger)",
                    "Unlimited Quizzes, Flashcards & Spaced Repetition",
                    "AI Mock Interview Simulator with voice & scorecards",
                    "ATS Resume Assistant with keyword optimizer",
                    "Priority 24/7 AI support & progress analytics"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register?plan=pro"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl text-center text-xs font-bold shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02]"
              >
                Upgrade to Pro Now
              </Link>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#141424] border border-white/[0.06] rounded-3xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Enterprise
                    <Building className="w-4 h-4 text-slate-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Tailored for colleges, bootcamps, and organizations</p>
                </div>

                <div className="py-4 border-y border-white/[0.06] my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">Custom</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Volume discounts for cohorts & institutions</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  {[
                    "Custom LMS Integration (Canvas, Blackboard, Moodle)",
                    "AI fine-tuning on custom university syllabi",
                    "Bulk student seats & campus license keys",
                    "Enterprise Admin dashboard & cohort metrics",
                    "Single Sign-On (SSO) & role-based access",
                    "99.9% Uptime SLA & dedicated account manager"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setContactSalesOpen(true)}
                className="w-full py-3.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-center text-xs font-semibold border border-white/[0.08] transition-all hover:scale-[1.02] cursor-pointer"
              >
                Contact Enterprise Sales
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Blog Section */}
      <section id="blog" className="py-24 px-6 sm:px-8 bg-[#0d0d18] border-t border-white/[0.04] scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              Knowledge Hub
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Latest Insights & Guides
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Explore proven strategies on artificial intelligence, technical interview preparation, and efficient studying.
            </p>
          </div>

          {/* 6 Blog Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogArticles.map((article, index) => (
              <motion.article
                key={article.id}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-[#141424] border border-white/[0.06] hover:border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-semibold">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-200 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-6 line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{article.date}</span>
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call to Action Section */}
      <section className="py-28 px-6 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a12]" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-[#0a0a12] to-purple-500/20" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#161625]/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-10 md:p-16 text-center shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Join 10,000+ Students Worldwide
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              Ready to Accelerate Your Learning?
            </h2>

            <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Start with free access to AI tutoring, PDF comprehension, and coding environments. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-xl font-bold text-base shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setVideoModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white rounded-xl font-semibold text-base transition-all"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Watch Product Demo</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Modals */}
      <VideoDemoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onExplorePreview={() => {
          const el = document.getElementById("platform-preview");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <ArticleReaderModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <ContactSalesModal
        isOpen={contactSalesOpen}
        onClose={() => setContactSalesOpen(false)}
      />

    </div>
  );
};
