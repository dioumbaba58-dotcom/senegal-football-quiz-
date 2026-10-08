import { useEffect, useRef, useState } from "react";
import type { GameResult } from "./GameScreen";
import { rankTitle } from "../game/logic";
import { loadName, renameScore, saveName, saveScore } from "../game/storage";
import type { ParticlesHandle } from "../game/Particles";
import { sfx } from "../game/sound";

interface Props {
  result: GameResult;
  particles: React.RefObject<ParticlesHandle | null>;
  onReplay: () => void;
  onHome: () => void;
  onBoard: (highlight: number) => void;
}

export function ResultScreen({ result, particles, onReplay, onHome, onBoard }: Props) {
  const [name, setName] = useState(loadName());
  const [displayScore, setDisplayScore] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const entryDate = useRef(Date.now());
  const rt = rankTitle(result.correct, result.total);
  const isBest = rank === 0;

  // Count-up + confetti
  useEffect(() => {
    const dur = 900;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(result.score * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    if (result.won) {
      sfx.victory();
      const w = window.innerWidth;
      const h = window.innerHeight;
      setTimeout(() => particles.current?.burst(w * 0.2, h * 0.3, "confetti"), 100);
      setTimeout(() => particles.current?.burst(w * 0.8, h * 0.3, "confetti"), 400);
      setTimeout(() => particles.current?.burst(w * 0.5, h * 0.2, "confetti"), 800);
    } else {
      sfx.gameOver();
      setTimeout(() => particles.current?.burst(window.innerWidth / 2, window.innerHeight * 0.25, "confetti"), 300);
    }
    return () => cancelAnimationFrame(raf);
  }, [result, particles]);

  // Auto-save
  useEffect(() => {
    const { rank } = saveScore({
      name: name.trim(),
      score: result.score,
      correct: result.correct,
      total: result.total,
      bestStreak: result.bestStreak,
      date: entryDate.current,
    });
    setRank(rank);
    setSaved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rename in place
  const updateName = (n: string) => {
    setName(n);
    saveName(n);
    renameScore(entryDate.current, n.trim());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "r") {
        e.preventDefault();
        onReplay();
      } else if (e.key === "Escape") onHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onReplay, onHome]);

  const pct = Math.round((result.correct / result.total) * 100);

  return (
    <div className="flex h-full flex-col px-5 safe-top safe-bottom">
      <div className="no-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto py-4 text-center">
        <div className="pop-in">
          <div className="text-6xl">{result.won ? "🏆" : "💔"}</div>
          <h2 className="font-display mt-2 text-3xl font-black tracking-tight">
            {result.won ? "PARTIE TERMINÉE !" : "GAME OVER"}
          </h2>
          <p className="mt-1 text-sm font-bold text-white/60">
            {result.won ? "Tu as affronté les 4 niveaux !" : `Éliminé à la question ${result.answered}`}
          </p>
        </div>

        <div
          className="pop-in mt-5 w-full max-w-sm rounded-3xl bg-white p-5 text-sn-green-dark shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-[11px] font-black tracking-[0.3em] text-sn-green">SCORE FINAL</div>
          <div className="font-display text-6xl leading-none font-black tabular-nums">{displayScore}</div>
          {isBest && saved && (
            <div className="font-display pop-in mt-2 inline-block rounded-full bg-gradient-to-r from-sn-yellow to-sn-gold px-3 py-1 text-xs font-black">
              🎉 NOUVEAU RECORD !
            </div>
          )}
          {!isBest && rank !== null && rank >= 0 && (
            <div className="mt-2 inline-block rounded-full bg-sn-green/10 px-3 py-1 text-xs font-black text-sn-green">
              #{rank + 1} au classement
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Bonnes" value={`${result.correct}/${result.total}`} icon="✅" />
            <Stat label="Précision" value={`${pct}%`} icon="🎯" />
            <Stat label="Série max" value={`${result.bestStreak}`} icon="🔥" />
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-sn-green/10 via-sn-yellow/20 to-sn-red/10 px-3 py-2.5">
            <div className="text-[10px] font-black tracking-widest text-sn-green-dark/60 uppercase">Ton rang</div>
            <div className="font-display text-base font-black">
              {rt.emoji} {rt.title}
            </div>
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => updateName(e.target.value.slice(0, 14))}
          placeholder="Ton pseudo pour le classement"
          className="slide-up mt-4 w-full max-w-sm rounded-2xl border-2 border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm font-extrabold text-white placeholder:text-white/40 focus:border-sn-yellow focus:outline-none"
          style={{ animationDelay: "0.2s" }}
        />
      </div>

      <div className="slide-up w-full space-y-2.5 pb-1" style={{ animationDelay: "0.25s" }}>
        <button
          onClick={() => {
            sfx.tap();
            onReplay();
          }}
          className="btn-3d font-display w-full rounded-2xl bg-gradient-to-b from-sn-yellow to-sn-gold py-4 text-2xl font-black tracking-wider text-sn-green-dark shadow-[0_6px_0_#b8860b,0_12px_24px_rgba(0,0,0,0.4)]"
        >
          🔄 REJOUER
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              sfx.tap();
              onBoard(entryDate.current);
            }}
            className="btn-3d font-display rounded-2xl bg-gradient-to-b from-sn-green to-emerald-800 py-3 text-sm font-black tracking-wider text-white shadow-[0_5px_0_#063d20]"
          >
            🏆 CLASSEMENT
          </button>
          <button
            onClick={() => {
              sfx.tap();
              onHome();
            }}
            className="btn-3d font-display rounded-2xl bg-white/10 py-3 text-sm font-black tracking-wider text-white shadow-[0_5px_0_rgba(0,0,0,0.4)]"
          >
            🏠 ACCUEIL
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-sn-green-dark/5 py-2.5">
      <div className="text-lg">{icon}</div>
      <div className="font-display text-lg leading-tight font-black">{value}</div>
      <div className="text-[10px] font-extrabold tracking-wider text-sn-green-dark/60 uppercase">{label}</div>
    </div>
  );
}
