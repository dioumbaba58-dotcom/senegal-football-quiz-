import { useCallback, useRef, useState } from "react";
import { Particles, type ParticlesHandle } from "./game/Particles";
import { HomeScreen } from "./screens/HomeScreen";
import { RulesScreen } from "./screens/RulesScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { GameScreen, type GameResult } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";

type Screen = "home" | "rules" | "board" | "game" | "result";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [highlight, setHighlight] = useState<number | undefined>();
  const [boardBack, setBoardBack] = useState<Screen>("home");
  const particles = useRef<ParticlesHandle | null>(null);

  const startGame = useCallback(() => {
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);
  const goHome = useCallback(() => setScreen("home"), []);
  const goRules = useCallback(() => setScreen("rules"), []);
  const goBoard = useCallback(() => {
    setHighlight(undefined);
    setBoardBack("home");
    setScreen("board");
  }, []);
  const onFinish = useCallback((r: GameResult) => {
    setResult(r);
    setScreen("result");
  }, []);
  const boardFromResult = useCallback((h: number) => {
    setHighlight(h);
    setBoardBack("result");
    setScreen("board");
  }, []);
  const backFromBoard = useCallback(() => setScreen(boardBack), [boardBack]);

  return (
    <div className="bg-pitch fixed inset-0 overflow-hidden">
      <div className="bg-stripes absolute inset-0" />
      {/* decorative glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sn-green/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-sn-red/20 blur-3xl" />
      <div className="relative mx-auto h-full w-full max-w-md">
        {screen === "home" && <HomeScreen onPlay={startGame} onBoard={goBoard} onRules={goRules} />}
        {screen === "rules" && <RulesScreen onBack={goHome} onPlay={startGame} />}
        {screen === "board" && <LeaderboardScreen onBack={backFromBoard} highlight={highlight} />}
        {screen === "game" && <GameScreen key={gameKey} particles={particles} onFinish={onFinish} onQuit={goHome} />}
        {screen === "result" && result && (
          <ResultScreen
            result={result}
            particles={particles}
            onReplay={startGame}
            onHome={goHome}
            onBoard={boardFromResult}
          />
        )}
      </div>
      <Particles ref={particles} />
    </div>
  );
}
