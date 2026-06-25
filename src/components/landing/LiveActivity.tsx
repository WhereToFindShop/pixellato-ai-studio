import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const steps = [
  { icon: "🟢", text: 'Trend detected: "AI Agents"', color: "var(--neon-cyan)" },
  { icon: "✍️", text: "Creating slogan...", color: "var(--neon-blue)" },
  { icon: "🎨", text: "Generating artwork...", color: "var(--neon-purple)" },
  { icon: "🛍", text: "Publishing product...", color: "var(--neon-pink)" },
  { icon: "✓", text: "Product is now live", color: "var(--neon-cyan)" },
];

export function LiveActivity() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-strong rounded-2xl p-5 w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-neon-cyan animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-neon-cyan" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Live AI Activity</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">REALTIME</span>
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active || (active === 0 && i === steps.length - 1 && false);
          return (
            <motion.div
              key={s.text}
              initial={false}
              animate={{
                opacity: isActive ? 1 : i < active ? 0.55 : 0.35,
                x: isActive ? 4 : 0,
              }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{
                background: isActive ? `color-mix(in oklch, ${s.color} 12%, transparent)` : "transparent",
                border: `1px solid ${isActive ? `color-mix(in oklch, ${s.color} 30%, transparent)` : "transparent"}`,
              }}
            >
              <span className="text-base w-5 text-center">{s.icon}</span>
              <span className="text-sm flex-1">{s.text}</span>
              {isActive && (
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  />
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
