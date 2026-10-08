import { QUESTIONS, type Difficulty, type Question } from "../data/questions";

export const LEVELS: Difficulty[] = ["Facile", "Moyen", "Difficile", "Expert"];
export const PER_LEVEL = 5; // questions per level in a run
export const TOTAL = PER_LEVEL * LEVELS.length; // 20 questions
export const LIVES = 3;
export const BASE_POINTS = 100;
export const TIME_PER_QUESTION: Record<Difficulty, number> = {
  Facile: 15,
  Moyen: 15,
  Difficile: 18,
  Expert: 20,
};

export const LEVEL_COLORS: Record<Difficulty, string> = {
  Facile: "from-emerald-400 to-green-600",
  Moyen: "from-yellow-300 to-amber-500",
  Difficile: "from-orange-400 to-red-500",
  Expert: "from-fuchsia-500 to-purple-700",
};

export const LEVEL_ICONS: Record<Difficulty, string> = {
  Facile: "🌱",
  Moyen: "⚽",
  Difficile: "🔥",
  Expert: "👑",
};

export interface RunQuestion extends Question {
  answers: string[]; // shuffled
  correct: number; // index in shuffled
  level: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildRun(): RunQuestion[] {
  const out: RunQuestion[] = [];
  LEVELS.forEach((lvl, li) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.d === lvl)).slice(0, PER_LEVEL);
    pool.forEach((q) => {
      const idx = shuffle([0, 1, 2, 3]);
      const answers = idx.map((i) => q.a[i]);
      out.push({ ...q, answers, correct: idx.indexOf(q.c), level: li });
    });
  });
  return out;
}

/** Points earned for a correct answer given current streak (after increment) and time left ratio. */
export function pointsFor(streak: number, timeRatio: number, level: number) {
  const streakBonus = streak >= 3 ? Math.min(streak - 2, 5) * 25 : 0; // +25 per streak beyond 2, cap 125
  const speed = Math.round(timeRatio * 50); // up to +50 for speed
  const lvlBonus = level * 25;
  return { base: BASE_POINTS, streakBonus, speed, lvlBonus, total: BASE_POINTS + streakBonus + speed + lvlBonus };
}

export function rankTitle(correct: number, total: number): { title: string; emoji: string } {
  const r = correct / total;
  if (r >= 0.95) return { title: "Légende des Lions", emoji: "🦁👑" };
  if (r >= 0.8) return { title: "Capitaine de la Teranga", emoji: "🏆" };
  if (r >= 0.6) return { title: "Titulaire indiscutable", emoji: "⭐" };
  if (r >= 0.4) return { title: "Joueur prometteur", emoji: "⚽" };
  if (r >= 0.2) return { title: "Supporter passionné", emoji: "📣" };
  return { title: "Recrue en formation", emoji: "🌱" };
}
