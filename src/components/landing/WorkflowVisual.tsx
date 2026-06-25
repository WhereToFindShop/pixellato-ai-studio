import { motion } from "framer-motion";
import { Search, Sparkles, Palette, Rocket } from "lucide-react";

const nodes = [
  { icon: Search, label: "Discover Trends", color: "var(--neon-cyan)" },
  { icon: Sparkles, label: "Generate Idea", color: "var(--neon-blue)" },
  { icon: Palette, label: "Create Artwork", color: "var(--neon-purple)" },
  { icon: Rocket, label: "Publish Product", color: "var(--neon-pink)" },
];

export function WorkflowVisual() {
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto">
      {/* Glow halo */}
      <div className="absolute inset-0 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 50%, var(--neon-purple), transparent 60%)" }} />

      {/* Connecting SVG paths */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" fill="none">
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.16 210)" />
            <stop offset="100%" stopColor="oklch(0.7 0.24 295)" />
          </linearGradient>
        </defs>
        {[
          "M200 60 L340 200",
          "M340 200 L200 340",
          "M200 340 L60 200",
          "M60 200 L200 60",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#flowGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="animate-flow"
            opacity="0.7"
          />
        ))}
        <circle cx="200" cy="200" r="80" stroke="oklch(1 0 0 / 0.1)" strokeWidth="1" />
        <circle cx="200" cy="200" r="140" stroke="oklch(1 0 0 / 0.06)" strokeWidth="1" />
      </svg>

      {/* Center core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-32 w-32 rounded-full glass-strong flex items-center justify-center glow-purple">
          <div className="absolute inset-2 rounded-full" style={{ background: "var(--gradient-hero)", opacity: 0.25 }} />
          <span className="relative font-display text-2xl font-bold text-gradient-primary">AI</span>
        </div>
      </motion.div>

      {/* Nodes positioned around */}
      {nodes.map((n, i) => {
        const positions = [
          { top: "2%", left: "50%", x: "-50%", y: "0" },
          { top: "50%", left: "98%", x: "-100%", y: "-50%" },
          { top: "98%", left: "50%", x: "-50%", y: "-100%" },
          { top: "50%", left: "2%", x: "0", y: "-50%" },
        ][i];
        const Icon = n.icon;
        return (
          <motion.div
            key={n.label}
            className="absolute z-20"
            style={{ top: positions.top, left: positions.left, transform: `translate(${positions.x}, ${positions.y})` }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-2.5 min-w-[170px]"
              style={{ boxShadow: `0 0 30px color-mix(in oklch, ${n.color} 30%, transparent)` }}
            >
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in oklch, ${n.color} 18%, transparent)`, border: `1px solid color-mix(in oklch, ${n.color} 40%, transparent)` }}>
                <Icon className="h-4.5 w-4.5" style={{ color: n.color }} strokeWidth={2} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</div>
                <div className="text-sm font-medium">{n.label}</div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
