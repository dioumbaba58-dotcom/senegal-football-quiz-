export interface ScoreEntry {
  name: string;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  date: number;
}

const KEY = "sfq_scores_v1";
const NAME_KEY = "sfq_name";

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): { list: ScoreEntry[]; rank: number } {
  const list = [...loadScores(), entry].sort((a, b) => b.score - a.score || b.correct - a.correct).slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(list));
  const rank = list.findIndex((e) => e.date === entry.date);
  return { list, rank };
}

export function renameScore(date: number, name: string) {
  const list = loadScores().map((e) => (e.date === date ? { ...e, name } : e));
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearScores() {
  localStorage.removeItem(KEY);
}

export function getBest(): number {
  const l = loadScores();
  return l.length ? l[0].score : 0;
}

export function loadName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}
export function saveName(n: string) {
  localStorage.setItem(NAME_KEY, n.slice(0, 14));
}
