import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

// Standard Spring Motion Constants
export const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 26 }
};

export const SPRING_TRANSITION = { type: "spring" as const, stiffness: 380, damping: 30 };

// 1. Reusable Button Component with scale/hover feedback
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = "primary", 
  loading = false, 
  children, 
  className = "", 
  ...props 
}) => {
  const baseStyle = "font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B12] outline-none";
  
  const variants = {
    primary: "premium-button-primary text-white",
    secondary: "premium-button-secondary text-white",
    danger: "px-4 py-2 rounded-xl h-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/25",
    ghost: "px-4 py-2 rounded-xl h-10 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/10"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={SPRING_TRANSITION}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...(props as any)}
    >
      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </motion.button>
  );
};

// 2. Reusable Card Component with micro hover lifts
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  hoverLift = true, 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <motion.div
      whileHover={hoverLift ? { y: -4, scale: 1.01, borderColor: "rgba(139, 92, 246, 0.2)", boxShadow: "0 12px 40px 0 rgba(139, 92, 246, 0.08)" } : {}}
      transition={SPRING_TRANSITION}
      className={`p-5 rounded-2xl border border-white/5 bg-[#12131A] shadow-xl ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};

// 3. Shimmer Skeleton Loaders
export const SkeletonLoader: React.FC<{ variant?: "card" | "text" | "circle" | "list"; className?: string }> = ({ 
  variant = "text", 
  className = "" 
}) => {
  const base = "animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded-xl";
  
  const styles = {
    text: "h-3 w-3/4 my-1.5",
    card: "h-32 w-full p-4",
    circle: "w-10 h-10 rounded-full",
    list: "h-10 w-full my-2"
  };

  return <div className={`${base} ${styles[variant]} ${className}`} />;
};

// 4. Custom Switch Component (iOS slider)
interface SwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${
        checked ? "bg-indigo-600" : "bg-[#09090B] border border-white/5"
      }`}
    >
      <motion.div 
        layout
        transition={SPRING_TRANSITION}
        className="w-4 h-4 rounded-full bg-white shadow"
        style={{ x: checked ? "16px" : "0px" }}
      />
    </div>
  );
};

// 5. Reusable Badge with glowing states
export const Badge: React.FC<{ color?: "primary" | "success" | "warning" | "danger" | "ghost"; children: React.ReactNode }> = ({ 
  color = "primary", 
  children 
}) => {
  const styles = {
    primary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    ghost: "bg-slate-800/40 text-slate-400 border-slate-800/50"
  };

  return (
    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase select-none ${styles[color]}`}>
      {children}
    </span>
  );
};

// 6. Premium Empty States with Illustrations and CTA actions
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction
}) => {
  return (
    <motion.div 
      variants={FADE_UP}
      initial="initial"
      animate="animate"
      className="p-8 text-center flex flex-col items-center justify-center max-w-sm mx-auto space-y-4 border border-dashed border-white/5 bg-[#12131A] rounded-2xl shadow-inner select-none"
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-float-robot">
        {icon || <Sparkles className="w-6 h-6" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-white">{title}</h4>
        <p className="text-[10px] text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </motion.div>
  );
};

// 7. Reusable Error State Card with retry actions
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Synchronization Failed",
  message,
  onRetry
}) => {
  return (
    <Card className="max-w-md mx-auto p-6 border-rose-500/20 bg-rose-500/5 flex flex-col gap-4 text-center select-none">
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto animate-pulse">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <strong className="text-white text-xs font-bold block">{title}</strong>
        <p className="text-[10px] text-rose-400 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" onClick={onRetry} className="mx-auto w-fit">
          <RefreshCw className="w-3.5 h-3.5" /> Try Reconnecting
        </Button>
      )}
    </Card>
  );
};
