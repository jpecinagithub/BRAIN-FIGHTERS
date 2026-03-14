import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GamePage from '../pages/GamePage'

describe('GamePage', () => {
  it('muestra mensaje cuando el juego no existe', () => {
    render(
      <MemoryRouter initialEntries={['/play/ABC/game/inexistente/jugador']}>
        <Routes>
          <Route path="/play/:publicCode/game/:gameId/:player" element={<GamePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/juego no encontrado/i)).toBeInTheDocument()
  })
})
