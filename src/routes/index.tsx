import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, TrendingUp, Brain, Palette, Rocket,
  Sparkles, Zap, Activity, Globe, ShoppingBag, Clock,
} from "lucide-react";
import { WorkflowVisual } from "@/components/landing/WorkflowVisual";
import { LiveActivity } from "@/components/landing/LiveActivity";
import { ParticleField } from "@/components/landing/ParticleField";
import { Counter } from "@/components/landing/Counter";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pixellato — The Internet's First Autonomous AI Merchandise Store" },
      { name: "description", content: "Pixellato continuously discovers trending topics across the internet and automatically designs, generates and publishes unique products every 15 minutes." },
      { property: "og:title", content: "Pixellato — Autonomous AI Merchandise Store" },
      { property: "og:description", content: "Trends in. Products out. Every 15 minutes — fully autonomous." },
    ],
  }),
  component: Landing,
});

const products = [
  { img: product1, title: "Neon Agent Tee", slogan: "I, for one, welcome our AI overlords.", trend: "AI Agents", time: "3 min ago", price: "$32" },
  { img: product2, title: "Geometric Hoodie", slogan: "Compiled in the cloud, worn on earth.", trend: "Quantum Design", time: "11 min ago", price: "$68" },
  { img: product3, title: "Circuit Mug", slogan: "Powered by caffeine & tokens.", trend: "Dev Culture", time: "18 min ago", price: "$22" },
  { img: product4, title: "Pixel Cap", slogan: "All systems nominal.", trend: "Streetwear AI", time: "26 min ago", price: "$28" },
];

const steps = [
  { icon: TrendingUp, title: "Trend Discovery", desc: "Continuously analyses internet trends across social, news, and search.", color: "var(--neon-cyan)" },
  { icon: Brain, title: "AI Product Creation", desc: "Generates names, slogans and descriptions calibrated to each trend.", color: "var(--neon-blue)" },
  { icon: Palette, title: "AI Artwork", desc: "Creates original product artwork ready for print and publish.", color: "var(--neon-purple)" },
  { icon: Rocket, title: "Autonomous Publishing", desc: "Publishes products end-to-end with zero human input.", color: "var(--neon-pink)" },
];

const metrics = [
  { icon: Activity, label: "Trends Analysed Today", value: 14823, suffix: "" },
  { icon: Sparkles, label: "Products Generated", value: 9617, suffix: "" },
  { icon: Brain, label: "AI Agents Running", value: 42, suffix: "" },
  { icon: ShoppingBag, label: "Products Published", value: 7488, suffix: "" },
  { icon: Clock, label: "Avg Generation Time", value: 14.6, suffix: "s", decimals: 1 },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#060608" }}>
      {/* Ambient backgrounds */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40 animate-grid-pan" />
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--neon-purple), transparent 60%)" }} />
        <div className="absolute top-1/3 -right-40 h-[40rem] w-[40rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--neon-cyan), transparent 60%)" }} />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--neon-blue), transparent 60%)" }} />
      </div>

      {/* Nav */}
      <header className="relative z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg glass-strong flex items-center justify-center glow-purple">
              <Sparkles className="h-4 w-4" style={{ color: "var(--neon-cyan)" }} />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Pixellato</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#drops" className="hover:text-foreground transition">Drops</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#metrics" className="hover:text-foreground transition">Metrics</a>
          </div>
          <button className="glass rounded-full px-4 py-2 text-sm font-medium hover:bg-white/5 transition">
            Open Store
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10">
        <ParticleField />
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 md:pt-20 md:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Autonomous · Online · Generating Now
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            >
              The Internet's First{" "}
              <span className="text-gradient-primary">Autonomous AI</span>{" "}
              Merchandise Store
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              Pixellato continuously discovers trending topics across the internet and automatically
              designs, generates and publishes unique products every 15 minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a href="#drops" className="group relative inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-primary-foreground overflow-hidden"
                style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow-purple)" }}>
                <span className="relative z-10">Browse Latest Drops</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
              <a href="#how" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium hover:bg-white/5 transition">
                <Play className="h-4 w-4" />
                See How It Works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10"
            >
              <LiveActivity />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="relative"
          >
            <WorkflowVisual />
          </motion.div>
        </div>
      </section>

      {/* LATEST DROPS */}
      <section id="drops" className="relative z-10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                / Drops · auto-refresh every 15 min
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold">Latest AI Drops</h2>
            </div>
            <div className="glass rounded-full px-4 py-2 text-sm flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" style={{ color: "var(--neon-cyan)" }} />
              <span className="text-muted-foreground">Next drop in</span>
              <span className="font-mono">04:12</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative glass rounded-2xl overflow-hidden transition"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none"
                  style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--neon-purple) 25%, transparent), transparent 60%)" }} />
                <div className="relative aspect-square overflow-hidden">
                  <img src={p.img} alt={p.title} loading="lazy" width={1024} height={1024}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 glass rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                    <TrendingUp className="h-3 w-3" style={{ color: "var(--neon-cyan)" }} />
                    {p.trend}
                  </div>
                  <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 text-[10px] font-mono text-muted-foreground">
                    {p.time}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">"{p.slogan}"</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-lg text-gradient-primary font-semibold">{p.price}</span>
                    <button className="text-xs font-medium rounded-full px-3 py-1.5 border border-white/10 hover:border-white/30 hover:bg-white/5 transition">
                      View
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">/ The Loop</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">How Pixellato Works</h2>
            <p className="mt-4 text-muted-foreground">
              A closed loop of four autonomous agents — running 24/7, without a human in sight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="group relative glass rounded-2xl p-6 hover:bg-white/[0.03] transition"
                >
                  <div className="text-xs font-mono text-muted-foreground mb-4">0{i + 1}</div>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition group-hover:scale-110"
                    style={{
                      background: `color-mix(in oklch, ${s.color} 14%, transparent)`,
                      border: `1px solid color-mix(in oklch, ${s.color} 35%, transparent)`,
                      boxShadow: `0 0 24px color-mix(in oklch, ${s.color} 25%, transparent)`,
                    }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section id="metrics" className="relative z-10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">/ Realtime Telemetry</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              The machine is <span className="text-gradient-primary">always on</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="relative glass-strong rounded-2xl p-6 overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
                    style={{ background: "var(--gradient-hero)" }} />
                  <Icon className="relative h-5 w-5 mb-4 text-muted-foreground" />
                  <div className="relative">
                    <Counter to={m.value} suffix={m.suffix} decimals={m.decimals ?? 0} />
                  </div>
                  <div className="relative mt-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {m.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative glass-strong rounded-3xl p-12 md:p-16 overflow-hidden text-center">
            <div className="absolute inset-0 opacity-40 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 0%, var(--neon-purple), transparent 60%)" }} />
            <Globe className="relative h-10 w-10 mx-auto mb-6" style={{ color: "var(--neon-cyan)" }} />
            <h2 className="relative font-display text-4xl md:text-5xl font-bold">
              Step inside the <span className="text-gradient-primary">autonomous store</span>
            </h2>
            <p className="relative mt-4 text-muted-foreground max-w-xl mx-auto">
              Every fifteen minutes, a new product. Designed, written, illustrated and shipped — by no one.
            </p>
            <a href="#drops" className="relative mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-medium text-primary-foreground"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow-purple)" }}>
              Browse Latest Drops <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--neon-cyan)" }} />
            <span className="font-display text-foreground">Pixellato</span>
            <span>· Autonomous since 2026</span>
          </div>
          <div className="font-mono text-xs">© Pixellato · All artwork AI-generated</div>
        </div>
      </footer>
    </div>
  );
}
