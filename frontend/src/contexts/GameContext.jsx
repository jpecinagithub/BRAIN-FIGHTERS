import { createContext, useContext, useMemo, useState } from 'react'
import { submitScore } from '../api/api'

const GameContext = createContext()

export const useGameContext = () => useContext(GameContext)

export const GameProvider = ({ children }) => {
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [globalError, setGlobalError] = useState(null)

  const setPlayer = (playerName) => {
    setCurrentPlayer(playerName)
  }

  const submitPlayerScore = async (player, points, game) => {
    setGlobalError(null)
    try {
      return await submitScore(player, points, game)
    } catch (error) {
      console.error('API Error submitting score:', error)
      setGlobalError('No se pudo enviar la puntuación. Revisa el servidor API.')
      return null
    }
  }

  const value = useMemo(
    () => ({
      currentPlayer,
      setPlayer,
      submitPlayerScore,
      globalError,
      setGlobalError
    }),
    [currentPlayer, globalError]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
