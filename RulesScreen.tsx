import { useEffect } from "react";
import { LEVELS, LEVEL_ICONS, PER_LEVEL, TOTAL } from "../game/logic";
import { sfx } from "../game/sound";

export function RulesScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") onBack();
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, onPlay]);

  const rules = [
    { i: "❓", t: `${TOTAL} questions par partie`, s: `${PER_LEVEL} par niveau, une question à la fois, 4 réponses.` },
    { i: "❤️", t: "3 vies", s: "Une mauvaise réponse ou le temps écoulé = une vie perdue." },
    { i: "⏱️", t: "Chrono", s: "Réponds vite pour un bonus de vitesse jusqu'à +50 pts." },
    { i: "💯", t: "+100 points", s: "Par bonne réponse, plus un bonus selon le niveau." },
    { i: "🔥", t: "Séries", s: "À partir de 3 bonnes réponses d'affilée : +25 pts par palier." },
    { i: "⏸️", t: "Pause", s: "Touche P ou le bouton ⏸ pour mettre la partie en pause." },
  ];

  return (
    <div className="flex h-full flex-col px-5 safe-top safe-bottom">
      <Header title="RÈGLES" onBack={onBack} />
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto pb-4">
        {rules.map((r, k) => (
          <div
            key={r.t}
            className="slide-up flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4"
            style={{ animationDelay: `${k * 0.05}s` }}
          >
            <div className="text-3xl">{r.i}</div>
            <div>
              <div className="font-display text-base font-black">{r.t}</div>
              <div className="text-sm font-semibold text-white/70">{r.s}</div>
            </div>
          </div>
        ))}
        <div className="slide-up rounded-2xl border border-white/10 bg-white/10 p-4" style={{ animationDelay: "0.3s" }}>
          <div className="font-display mb-2 text-base font-black">📈 Difficulté progressive</div>
          <div className="grid grid-cols-4 gap-2">
            {LEVELS.map((l) => (
              <div key={l} className="rounded-xl bg-black/30 py-2 text-center">
                <div className="text-xl">{LEVEL_ICONS[l]}</div>
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-white/80">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          sfx.tap();
          onPlay();
        }}
        className="btn-3d font-display mt-2 w-full rounded-2xl bg-gradient-to-b from-sn-yellow to-sn-gold py-4 text-xl font-black tracking-wider text-sn-green-dark shadow-[0_6px_0_#b8860b,0_12px_24px_rgba(0,0,0,0.4)]"
      >
        C'EST PARTI !
      </button>
    </div>
  );
}

export function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-3 pt-2">
      <button
        onClick={() => {
          sfx.tap();
          onBack();
        }}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl font-black active:scale-90"
        aria-label="Retour"
      >
        ←
      </button>
      <h2 className="font-display text-2xl font-black tracking-wide">{title}</h2>
    </div>
  );
}
