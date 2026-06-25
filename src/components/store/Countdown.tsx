import { useEffect, useRef, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s, done: ms === 0 };
}

export function Countdown({
  to,
  compact = false,
  onElapsed,
}: {
  to: string | Date;
  compact?: boolean;
  /** Fired once when the target time is reached — use to refetch shop_config. */
  onElapsed?: () => void;
}) {
  const target = typeof to === "string" ? new Date(to).getTime() : to.getTime();
  const [t, setT] = useState(() => diff(target));
  const elapsedRef = useRef(false);

  useEffect(() => {
    elapsedRef.current = false;
  }, [target]);

  useEffect(() => {
    const i = window.setInterval(() => setT(diff(target)), 1000);
    return () => window.clearInterval(i);
  }, [target]);

  useEffect(() => {
    if (t.done && !elapsedRef.current) {
      elapsedRef.current = true;
      onElapsed?.();
    }
  }, [t.done, onElapsed]);

  if (t.done) return <span className="text-sm text-muted-foreground">Released</span>;

  const seg = (n: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="font-mono text-lg tabular-nums tracking-tight text-foreground sm:text-xl">{String(n).padStart(2, "0")}</span>
      <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );

  if (compact) {
    return (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {t.d}d {String(t.h).padStart(2, "0")}:{String(t.m).padStart(2, "0")}:{String(t.s).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-5">
      {seg(t.d, "Days")}
      {seg(t.h, "Hrs")}
      {seg(t.m, "Min")}
      {seg(t.s, "Sec")}
    </div>
  );
}
