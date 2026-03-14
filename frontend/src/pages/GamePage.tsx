import type { ComponentType } from "react"
import { useParams } from "react-router-dom"
import MathGame from "../games/MathGame.jsx"
import MemoryGame from "../games/MemoryGame.jsx"
import NumberEchoGame from "../games/NumberEchoGame.jsx"
import PathMemoryGame from "../games/PathMemoryGame.jsx"
import PuzzleGame from "../games/PuzzleGame.jsx"
import QuickCompareGame from "../games/QuickCompareGame.jsx"
import RotationGame from "../games/RotationGame.jsx"
import RuleMatchGame from "../games/RuleMatchGame.jsx"
import SequenceLogicGame from "../games/SequenceLogicGame.jsx"
import SimonGame from "../games/SimonGame.jsx"
import StroopGame from "../games/StroopGame.jsx"
import VisualSearchGame from "../games/VisualSearchGame.jsx"

const gameMap: Record<string, ComponentType> = {
  simon: SimonGame,
  puzzle: PuzzleGame,
  memory: MemoryGame,
  math: MathGame,
  stroop: StroopGame,
  sequence: SequenceLogicGame,
  path: PathMemoryGame,
  search: VisualSearchGame,
  rotation: RotationGame,
  compare: QuickCompareGame,
  rule: RuleMatchGame,
  echo: NumberEchoGame
}

export default function GamePage() {
  const { gameId } = useParams()
  if (!gameId || !gameMap[gameId]) {
    return <div className="play-page">Juego no encontrado.</div>
  }
  const Component = gameMap[gameId]
  return <Component />
}
