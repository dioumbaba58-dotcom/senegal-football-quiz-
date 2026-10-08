import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRun,
  LEVELS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LIVES,
  PER_LEVEL,
  pointsFor,
  TIME_PER_QUESTION,
  TOTAL,
  type RunQuestion,
} from "../game/logic";
import type { ParticlesHandle } from "../game/Particles";
import { sfx } from "../game/sound";

export interface GameResult {
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  answered: number;
  won: boolean;
}

interface Props {
  particles: React.RefObject<ParticlesHandle | null>;
  onFinish: (r: GameResult) => void;
  onQuit: () => void;
}

type Phase = "intro" | "question" | "feedback" | "levelup";

const KEYS = ["1", "2", "3", "4"];
const LETTERS = ["a", "b", "c", "d"];
const LABELS = ["A", "B", "C", "D"];

interface Floater {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export function GameScreen({ particles, onFinish, onQuit }: Props) {
  const [questions] = useState<RunQuestion[]>(() => buildRun());
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [selected, setSelected] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [lostHeart, setLostHeart] = useState<number | null>(null);
  const [scoreBump, setScoreBump] = useState(0);
  const [streakBump, setStreakBump] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const q = questions[idx];
  const level = LEVELS[q.level];
  const maxTime = TIME_PER_QUESTION[level];
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const floaterId = useRef(0);
  const timeRef = useRef(0);
  const finishedRef = useRef(false);

  // ------- Intro -> first question
  useEffect(() => {
    const t = setTimeout(() => setPhase("question"), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- Timer per question
  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(maxTime);
    timeRef.current = maxTime;
  }, [idx, phase, maxTime]);

  const handleAnswer = useCallback(
    (choice: number | null) => {
      if (phase !== "question" || paused) return;
      const isCorrect = choice === q.correct;
      setSelected(choice);
      setPhase("feedback");

      const el = choice !== null ? btnRefs.current[choice] : null;
      const rect = el?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      if (isCorrect) {
        const newStreak = streak + 1;
        const ratio = Math.max(0, timeRef.current / maxTime);
        const pts = pointsFor(newStreak, ratio, q.level);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setScore((s) => s + pts.total);
        setScoreBump((n) => n + 1);
        setFlash("green");
        particles.current?.burst(cx, cy, "correct");
        if (newStreak >= 3) {
          particles.current?.burst(window.innerWidth / 2, 90, "streak");
          setStreakBump((n) => n + 1);
          sfx.streak();
        } else sfx.correct();
        if (navigator.vibrate) navigator.vibrate(20);
        const parts: string[] = [`+${pts.base}`];
        if (pts.speed > 0) parts.push(`⚡+${pts.speed}`);
        if (pts.lvlBonus > 0) parts.push(`${LEVEL_ICONS[level]}+${pts.lvlBonus}`);
        if (pts.streakBonus > 0) parts.push(`🔥+${pts.streakBonus}`);
        const id = floaterId.current++;
        setFloaters((f) => [...f, { id, text: parts.join("  "), x: cx, y: cy - 20, color: "#4ade80" }]);
        setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
      } else {
        setStreak(0);
        setFlash("red");
        setShake(true);
        setLostHeart(lives - 1);
        setLives((l) => l - 1);
        particles.current?.burst(cx, cy, "wrong");
        sfx.wrong();
        if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
        const id = floaterId.current++;
        setFloaters((f) => [
          ...f,
          { id, text: choice === null ? "⏰ TEMPS ÉCOULÉ" : "✖ RATÉ", x: cx, y: cy - 20, color: "#f87171" },
        ]);
        setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
        setTimeout(() => setShake(false), 450);
      }
      setTimeout(() => setFlash(null), 500);
    },
    [phase, paused, q, streak, maxTime, lives, particles, level],
  );

  // Tick
  useEffect(() => {
    if (phase !== "question" || paused) return;
    const iv = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 0.1);
      const t = timeRef.current;
      setTimeLeft(t);
      if (t <= 3.05 && t > 2.95) sfx.tick();
      if (t <= 2.05 && t > 1.95) sfx.tick();
      if (t <= 1.05 && t > 0.95) sfx.tick();
      if (t <= 0) {
        clearInterval(iv);
        handleAnswer(null);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, paused, idx, handleAnswer]);

  // Advance after feedback
  const next = useCallback(() => {
    if (phase !== "feedback") return;
    if (lives <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish({ score, correct: correctCount, total: TOTAL, bestStreak, answered: idx + 1, won: false });
      }
      return;
    }
    if (idx + 1 >= TOTAL) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish({ score, correct: correctCount, total: TOTAL, bestStreak, answered: TOTAL, won: true });
      }
      return;
    }
    const nextQ = questions[idx + 1];
    setSelected(null);
    if (nextQ.level !== q.level) {
      setPhase("levelup");
      sfx.levelUp();
      setIdx(idx + 1);
      setTimeout(() => setPhase("question"), 1400);
    } else {
      setIdx(idx + 1);
      setPhase("question");
    }
  }, [phase, q, lives, idx, questions, onFinish, score, correctCount, bestStreak]);

  useEffect(() => {
    if (phase !== "feedback") return;
    const wasCorrect = selected === q.correct;
    const t = setTimeout(next, wasCorrect ? 1100 : 1700);
    return () => clearTimeout(t);
  }, [phase, next, selected, q]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "p" || k === "escape") {
        e.preventDefault();
        if (confirmQuit) {
          setConfirmQuit(false);
          return;
        }
        if (phase === "question" || paused) {
          setPaused((p) => !p);
          sfx.tap();
        }
        return;
      }
      if (paused || phase !== "question") {
        if ((k === "enter" || k === " ") && phase === "feedback") next();
        return;
      }
      let i = KEYS.indexOf(k);
      if (i < 0) i = LETTERS.indexOf(k);
      if (i >= 0) {
        e.preventDefault();
        handleAnswer(i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAnswer, paused, phase, next, confirmQuit]);

  const timerPct = (timeLeft / maxTime) * 100;
  const timerColor = timerPct > 50 ? "bg-sn-green" : timerPct > 25 ? "bg-sn-yellow" : "bg-sn-red";
  const progress = ((idx + (phase === "feedback" ? 1 : 0)) / TOTAL) * 100;

  const levelName = useMemo(() => level, [level]);

  return (
    <div className="relative flex h-full flex-col">
      {flash && <div className={`pointer-events-none fixed inset-0 z-40 ${flash === "green" ? "flash-green" : "flash-red"}`} />}

      {/* Floaters */}
      {floaters.map((f) => (
        <div
          key={f.id}
          className="float-up font-display pointer-events-none fixed z-50 text-lg font-black whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
          style={{ left: f.x, top: f.y, color: f.color }}
        >
          {f.text}
        </div>
      ))}

      <div className={`flex h-full flex-col safe-top safe-bottom ${shake ? "shake" : ""}`}>
      {/* HUD */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              sfx.tap();
              setPaused(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg active:scale-90"
            aria-label="Pause"
          >
            ⏸
          </button>
          <div className="flex gap-1 text-2xl">
            {Array.from({ length: LIVES }).map((_, i) => (
              <span
                key={i}
                className={`inline-block transition-all ${i < lives ? "" : lostHeart === i ? "heart-break" : "opacity-25 grayscale"}`}
              >
                ❤️
              </span>
            ))}
          </div>
          <div className="text-right">
            <div key={scoreBump} className="font-display count-up text-2xl leading-none font-black">
              {score}
            </div>
            <div className="text-[10px] font-extrabold tracking-widest text-white/50">POINTS</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sn-green via-sn-yellow to-sn-red transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="font-display text-xs font-black text-white/70">
            {Math.min(idx + 1, TOTAL)}/{TOTAL}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div
            className={`font-display rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-black tracking-widest text-white uppercase shadow ${LEVEL_COLORS[level]}`}
          >
            {LEVEL_ICONS[level]} {levelName}
          </div>
          {streak >= 2 && (
            <div key={streakBump} className="pop-in font-display streak-glow text-sm font-black text-sn-gold">
              🔥 SÉRIE ×{streak}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-center px-4 py-3">
        {phase === "intro" ? (
          <div className="pop-in text-center">
            <div className="text-6xl">🦁</div>
            <div className="font-display mt-2 text-3xl font-black">PRÊT ?</div>
            <div className="mt-1 text-sm font-bold text-white/60">Allez les Lions !</div>
          </div>
        ) : phase === "levelup" ? (
          <div className="pop-in text-center">
            <div className="text-6xl">{LEVEL_ICONS[level]}</div>
            <div className="font-display mt-2 text-xs font-black tracking-[0.3em] text-white/60">NIVEAU SUIVANT</div>
            <div
              className={`font-display mt-1 bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent uppercase ${LEVEL_COLORS[level]}`}
            >
              {level}
            </div>
            <div className="mt-2 text-sm font-bold text-white/60">+{q.level * 25} pts bonus par bonne réponse</div>
          </div>
        ) : (
          <div key={idx} className="slide-in-right flex flex-col">
            {/* Question card */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-5 text-sn-green-dark shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-sn-green via-sn-yellow to-sn-red" />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ease-linear ${timerColor}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <div className="mt-3 flex items-start gap-3">
                {q.img && (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sn-green/15 to-sn-yellow/30 text-3xl shadow-inner">
                    {q.img}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[10px] font-black tracking-widest text-sn-green uppercase">
                    Question {idx % PER_LEVEL + 1} · {Math.ceil(timeLeft)}s
                  </div>
                  <p className="font-display mt-1 text-[17px] leading-snug font-extrabold">{q.q}</p>
                </div>
              </div>
            </div>

            {/* Answers */}
            <div className="mt-4 grid grid-cols-1 gap-2.5">
              {q.answers.map((ans, i) => {
                const isSel = selected === i;
                const isCorrect = i === q.correct;
                let cls = "bg-white/10 border-white/15 text-white active:bg-white/20";
                let anim = "";
                if (phase === "feedback") {
                  if (isCorrect) {
                    cls = "bg-green-500 border-green-300 text-white";
                    anim = "pulse-correct";
                  } else if (isSel) {
                    cls = "bg-sn-red border-red-300 text-white";
                    anim = "wrong-wiggle";
                  } else cls = "bg-white/5 border-white/5 text-white/30";
                }
                return (
                  <button
                    key={i}
                    ref={(el) => {
                      btnRefs.current[i] = el;
                    }}
                    disabled={phase !== "question" || paused}
                    onClick={() => handleAnswer(i)}
                    className={`btn-3d flex min-h-[58px] items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left shadow-[0_4px_0_rgba(0,0,0,0.35)] transition-colors ${cls} ${anim}`}
                    style={{ animationDelay: phase === "question" ? `${i * 0.05}s` : "0s" }}
                  >
                    <span
                      className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        phase === "feedback" && (isCorrect || isSel) ? "bg-white/25" : "bg-sn-yellow text-sn-green-dark"
                      }`}
                    >
                      {phase === "feedback" && isCorrect ? "✓" : phase === "feedback" && isSel ? "✗" : LABELS[i]}
                    </span>
                    <span className="flex-1 text-[15px] leading-tight font-extrabold">{ans}</span>
                  </button>
                );
              })}
            </div>

            {phase === "feedback" && q.info && (
              <div className="slide-up mt-3 rounded-2xl border border-sn-yellow/30 bg-sn-yellow/10 px-4 py-2.5 text-center text-xs font-bold text-sn-yellow">
                💡 {q.info}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <div className="pop-in w-full max-w-xs rounded-3xl border border-white/15 bg-gradient-to-b from-sn-green-dark to-[#041c13] p-6 text-center shadow-2xl">
            <div className="text-5xl">⏸️</div>
            <h3 className="font-display mt-2 text-3xl font-black">PAUSE</h3>
            <p className="mt-1 text-sm font-bold text-white/60">
              Score : <span className="text-sn-yellow">{score}</span> · Question {idx + 1}/{TOTAL}
            </p>
            {!confirmQuit ? (
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => {
                    sfx.tap();
                    setPaused(false);
                  }}
                  className="btn-3d font-display w-full rounded-2xl bg-gradient-to-b from-sn-yellow to-sn-gold py-3.5 text-lg font-black text-sn-green-dark shadow-[0_5px_0_#b8860b]"
                >
                  ▶ REPRENDRE
                </button>
                <button
                  onClick={() => {
                    sfx.tap();
                    setConfirmQuit(true);
                  }}
                  className="btn-3d font-display w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white shadow-[0_5px_0_rgba(0,0,0,0.4)]"
                >
                  🏠 QUITTER
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-bold text-white/80">Abandonner la partie ? Le score sera perdu.</p>
                <button
                  onClick={() => {
                    sfx.tap();
                    onQuit();
                  }}
                  className="btn-3d font-display w-full rounded-2xl bg-gradient-to-b from-sn-red to-red-800 py-3.5 text-base font-black text-white shadow-[0_5px_0_#6b0d12]"
                >
                  OUI, QUITTER
                </button>
                <button
                  onClick={() => setConfirmQuit(false)}
                  className="btn-3d font-display w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white shadow-[0_5px_0_rgba(0,0,0,0.4)]"
                >
                  ANNULER
                </button>
              </div>
            )}
            <p className="mt-4 text-[11px] font-bold text-white/40">P ou Échap pour reprendre</p>
          </div>
        </div>
      )}
    </div>
  );
}
