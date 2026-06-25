import { motion } from "framer-motion";

export function ParticleField() {
  const particles = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const delay = (i % 7) * 0.6;
        const size = 2 + (i % 4);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-neon-cyan/60"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, filter: "blur(1px)" }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
