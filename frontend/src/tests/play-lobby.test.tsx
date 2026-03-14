import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import PlayLobby from '../pages/PlayLobby'

const mockGetPublicMatch = vi.fn()
const mockGetPublicRanking = vi.fn()

vi.mock('../api/public', () => ({
  getPublicMatch: (...args: unknown[]) => mockGetPublicMatch(...args),
  getPublicRanking: (...args: unknown[]) => mockGetPublicRanking(...args),
}))

describe('PlayLobby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra jugadores y habilita juegos al seleccionar', async () => {
    mockGetPublicMatch.mockResolvedValueOnce({
      id: 1,
      publicCode: 'ABC',
      status: 'active',
      players: [
        { id: 10, name: 'Ana', teamId: null },
        { id: 11, name: 'Luis', teamId: null },
      ],
      teams: [],
      games: [
        { code: 'memory', name: 'Memoria', description: 'Encuentra parejas', iconPath: '/icons/memory.png', isEnabled: true },
      ],
    })
    mockGetPublicRanking.mockResolvedValueOnce({
      players: [],
      teams: [],
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/play/ABC']}>
        <Routes>
          <Route path="/play/:publicCode" element={<PlayLobby />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/jugadores/i)).toBeInTheDocument()
    expect(screen.getByText(/selecciona un jugador/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ana' }))
    expect(await screen.findByText('Memoria')).toBeInTheDocument()
  })

  it('permite refrescar la clasificación', async () => {
    mockGetPublicMatch.mockResolvedValueOnce({
      id: 2,
      publicCode: 'XYZ',
      status: 'active',
      players: [{ id: 20, name: 'Iris', teamId: null }],
      teams: [],
      games: [],
    })
    mockGetPublicRanking.mockResolvedValueOnce({
      players: [],
      teams: [],
    })
    mockGetPublicRanking.mockResolvedValueOnce({
      players: [],
      teams: [],
    })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/play/XYZ']}>
        <Routes>
          <Route path="/play/:publicCode" element={<PlayLobby />} />
        </Routes>
      </MemoryRouter>
    )

    const refreshButton = await screen.findByRole('button', { name: /actualizar/i })
    await waitFor(() => expect(refreshButton).toBeEnabled())

    await user.click(refreshButton)
    await waitFor(() => expect(mockGetPublicRanking).toHaveBeenCalledTimes(2))
  })
})
