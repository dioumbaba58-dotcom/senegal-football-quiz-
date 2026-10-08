import { useEffect, useState } from "react";
import { clearScores, loadScores, type ScoreEntry } from "../game/storage";
import { Header } from "./RulesScreen";
import { sfx } from "../game/sound";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen({ onBack, highlight }: { onBack: () => void; highlight?: number }) {
  const [list, setList] = useState<ScoreEntry[]>(loadScores());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "Enter") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className="flex h-full flex-col px-5 safe-top safe-bottom">
      <Header title="🏆 CLASSEMENT" onBack={onBack} />
      <div className="no-scrollbar flex-1 overflow-y-auto pb-4">
        {list.length === 0 ? (
          <div className="pop-in mt-16 flex flex-col items-center text-center">
            <div className="text-6xl">🦁</div>
            <p className="font-display mt-4 text-xl font-black">Aucun score</p>
            <p className="mt-1 text-sm font-semibold text-white/60">Joue une partie pour entrer dans la légende !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((e, i) => {
              const isNew = highlight !== undefined && e.date === highlight;
              return (
                <div
                  key={e.date + "-" + i}
                  className={`slide-up flex items-center gap-3 rounded-2xl border p-3 ${
                    isNew
                      ? "border-sn-yellow bg-sn-yellow/20 shadow-[0_0_24px_rgba(253,239,66,0.35)]"
                      : i === 0
                        ? "border-sn-gold/50 bg-gradient-to-r from-yellow-500/20 to-transparent"
                        : "border-white/10 bg-white/8"
                  }`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="font-display w-9 text-center text-xl font-black">{MEDALS[i] ?? i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-black">
                      {e.name || "Lion anonyme"} {isNew && <span className="text-sn-yellow">· NOUVEAU</span>}
                    </div>
                    <div className="text-xs font-bold text-white/60">
                      ✅ {e.correct}/{e.total} · 🔥 série {e.bestStreak} ·{" "}
                      {new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                  <div className="font-display text-xl font-black text-sn-yellow">{e.score}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {list.length > 0 && (
        <button
          onClick={() => {
            if (confirm("Effacer tout le classement ?")) {
              clearScores();
              setList([]);
              sfx.tap();
            }
          }}
          className="mb-1 py-2 text-center text-xs font-bold text-white/40 underline-offset-2 active:underline"
        >
          Effacer le classement
        </button>
      )}
    </div>
  );
}
