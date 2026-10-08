import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "star";
  rot: number;
  vr: number;
}

export interface ParticlesHandle {
  burst: (x: number, y: number, kind: "correct" | "wrong" | "confetti" | "streak") => void;
}

const SN = ["#00853f", "#fdef42", "#e31b23", "#ffffff", "#ffc72c"];

export const Particles = forwardRef<ParticlesHandle>(function Particles(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const raf = useRef<number>(0);
  const running = useRef(false);

  const loop = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const arr = parts.current;
    const dpr = window.devicePixelRatio || 1;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life++;
      if (p.life >= p.max) {
        arr.splice(i, 1);
        continue;
      }
      p.vy += 0.18;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const t = 1 - p.life / p.max;
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x * dpr, p.y * dpr);
      ctx.rotate(p.rot);
      const s = p.size * dpr * (0.5 + t * 0.5);
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "star") {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = (k * 4 * Math.PI) / 5;
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-s / 2, -s / 4, s, s / 2);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (arr.length > 0) {
      raf.current = requestAnimationFrame(loop);
    } else {
      running.current = false;
    }
  };

  const ensureRunning = () => {
    if (!running.current) {
      running.current = true;
      raf.current = requestAnimationFrame(loop);
    }
  };

  useImperativeHandle(ref, () => ({
    burst(x, y, kind) {
      const arr = parts.current;
      const add = (n: number, colors: string[], speed: number, shape: P["shape"], spread = Math.PI * 2, dir = 0) => {
        for (let i = 0; i < n; i++) {
          const a = dir + (Math.random() - 0.5) * spread;
          const v = speed * (0.4 + Math.random());
          arr.push({
            x,
            y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v - speed * 0.3,
            life: 0,
            max: 40 + Math.random() * 40,
            size: 6 + Math.random() * 8,
            color: colors[(Math.random() * colors.length) | 0],
            shape,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
          });
        }
      };
      if (kind === "correct") {
        add(34, ["#22c55e", "#4ade80", "#fdef42", "#ffffff"], 9, "rect");
        add(10, ["#fdef42", "#ffc72c"], 7, "star");
      } else if (kind === "wrong") {
        add(22, ["#e31b23", "#f87171", "#7f1d1d"], 7, "circle");
      } else if (kind === "streak") {
        add(40, ["#ffc72c", "#fdef42", "#fff"], 12, "star");
      } else {
        add(120, SN, 13, "rect", Math.PI, -Math.PI / 2);
        add(30, SN, 10, "star");
      }
      if (arr.length > 500) arr.splice(0, arr.length - 500);
      ensureRunning();
    },
  }));

  useEffect(() => {
    const cv = canvasRef.current!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden
    />
  );
});
