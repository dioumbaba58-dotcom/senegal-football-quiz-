import { useEffect, useState } from "react";
import { getBest, loadName, saveName } from "../game/storage";
import { sfx } from "../game/sound";

interface Props {
  onPlay: () => void;
  onBoard: () => void;
  onRules: () => void;
}

export function HomeScreen({ onPlay, onBoard, onRules }: Props) {
  const [name, setName] = useState(loadName());
  const [muted, setMuted] = useState(sfx.isMuted());
  const best = getBest();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPlay();
      } else if (e.key.toLowerCase() === "c") onBoard();
      else if (e.key.toLowerCase() === "r") onRules();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay, onBoard, onRules]);

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 safe-top safe-bottom">
      <div className="flex w-full items-center justify-between pt-2">
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold tracking-wider text-sn-yellow">
          🏅 RECORD : {best}
        </div>
        <button
          onClick={() => {
            setMuted(sfx.toggle());
            sfx.tap();
          }}
          className="rounded-full bg-white/10 p-2 text-lg active:scale-90"
          aria-label="Son"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="pop-in flex flex-col items-center text-center">
        <div className="bounce-ball mb-3 text-7xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">⚽</div>
        <div className="mb-1 text-5xl">🇸🇳</div>
        <h1 className="font-display text-[2.6rem] leading-[0.95] font-black tracking-tight">
          <span className="block text-white">SÉNÉGAL</span>
          <span className="block shimmer-text">FOOTBALL</span>
          <span className="block text-white">QUIZ</span>
        </h1>
        <div className="mt-3 flex items-center gap-1">
          <span className="h-1.5 w-10 rounded-full bg-sn-green" />
          <span className="h-1.5 w-10 rounded-full bg-sn-yellow" />
          <span className="h-1.5 w-10 rounded-full bg-sn-red" />
        </div>
        <p className="mt-3 max-w-xs text-sm font-bold text-white/70">
          Teste tes connaissances sur les Lions de la Teranga 🦁
        </p>
      </div>

      <div className="slide-up w-full max-w-sm space-y-3" style={{ animationDelay: "0.15s" }}>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, 14));
            saveName(e.target.value);
          }}
          placeholder="Ton pseudo (optionnel)"
          className="w-full rounded-2xl border-2 border-white/15 bg-white/10 px-4 py-3 text-center text-base font-extrabold text-white placeholder:text-white/40 focus:border-sn-yellow focus:outline-none"
        />
        <button
          onClick={() => {
            sfx.unlock();
            sfx.tap();
            onPlay();
          }}
          className="btn-3d font-display w-full rounded-2xl bg-gradient-to-b from-sn-yellow to-sn-gold py-4 text-2xl font-black tracking-wider text-sn-green-dark shadow-[0_6px_0_#b8860b,0_12px_24px_rgba(0,0,0,0.4)]"
        >
          ▶ JOUER
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              sfx.tap();
              onBoard();
            }}
            className="btn-3d font-display rounded-2xl bg-gradient-to-b from-sn-green to-emerald-800 py-3.5 text-base font-black tracking-wider text-white shadow-[0_5px_0_#063d20,0_10px_20px_rgba(0,0,0,0.35)]"
          >
            🏆 CLASSEMENT
          </button>
          <button
            onClick={() => {
              sfx.tap();
              onRules();
            }}
            className="btn-3d font-display rounded-2xl bg-gradient-to-b from-sn-red to-red-800 py-3.5 text-base font-black tracking-wider text-white shadow-[0_5px_0_#6b0d12,0_10px_20px_rgba(0,0,0,0.35)]"
          >
            📖 RÈGLES
          </button>
        </div>
        <p className="pt-1 text-center text-[11px] font-bold text-white/40">
          Clavier : Entrée = Jouer · 1-4 = Répondre · P = Pause
        </p>
      </div>
    </div>
  );
}
