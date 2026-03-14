import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import MatchConfigPage from '../pages/MatchConfigPage'

const mockGetMatch = vi.fn()
const mockCreateTeam = vi.fn()
const mockCreatePlayer = vi.fn()
const mockUpdateMatchGames = vi.fn()
const mockDeleteTeam = vi.fn()
const mockDeletePlayer = vi.fn()
const mockAssignPlayerTeam = vi.fn()

vi.mock('../api/matches', () => ({
  getMatch: (...args: unknown[]) => mockGetMatch(...args),
  createTeam: (...args: unknown[]) => mockCreateTeam(...args),
  createPlayer: (...args: unknown[]) => mockCreatePlayer(...args),
  updateMatchGames: (...args: unknown[]) => mockUpdateMatchGames(...args),
  deleteTeam: (...args: unknown[]) => mockDeleteTeam(...args),
  deletePlayer: (...args: unknown[]) => mockDeletePlayer(...args),
  assignPlayerTeam: (...args: unknown[]) => mockAssignPlayerTeam(...args),
}))

describe('MatchConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carga la partida y permite crear equipos', async () => {
    const matchData = {
      id: 1,
      status: 'active',
      publicCode: 'MATCH1',
      players: [],
      teams: [{ id: 10, name: 'Equipo Alpha' }],
      matchGames: [
        {
          id: 1,
          isEnabled: true,
          game: { code: 'memory', name: 'Memoria', description: '' },
        },
      ],
    }

    mockGetMatch.mockResolvedValueOnce(matchData).mockResolvedValueOnce(matchData)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin/matches/1']}>
        <Routes>
          <Route path="/admin/matches/:id" element={<MatchConfigPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/configurar partida #1/i)).toBeInTheDocument()
    expect(screen.getByText('Equipo Alpha')).toBeInTheDocument()

    const teamCard = screen.getByText('Equipos').closest('.config-card')
    if (!teamCard) throw new Error('No se encontró el bloque de equipos')
    await user.type(within(teamCard).getByPlaceholderText(/nombre del equipo/i), 'Equipo Beta')
    await user.click(within(teamCard).getByRole('button', { name: /añadir/i }))

    await waitFor(() => expect(mockCreateTeam).toHaveBeenCalledWith(1, 'Equipo Beta'))
  })

  it('actualiza el estado de un juego', async () => {
    const matchData = {
      id: 2,
      status: 'active',
      publicCode: 'MATCH2',
      players: [],
      teams: [],
      matchGames: [
        {
          id: 55,
          isEnabled: true,
          game: { code: 'simon', name: 'Simon', description: '' },
        },
      ],
    }

    mockGetMatch.mockResolvedValueOnce(matchData).mockResolvedValueOnce(matchData)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin/matches/2']}>
        <Routes>
          <Route path="/admin/matches/:id" element={<MatchConfigPage />} />
        </Routes>
      </MemoryRouter>
    )

    const toggle = await screen.findByRole('checkbox')
    await user.click(toggle)

    await waitFor(() =>
      expect(mockUpdateMatchGames).toHaveBeenCalledWith(2, [{ code: 'simon', isEnabled: false }])
    )
  })

  it('permite crear jugadores', async () => {
    const matchData = {
      id: 3,
      status: 'active',
      publicCode: 'MATCH3',
      players: [],
      teams: [],
      matchGames: [],
    }

    mockGetMatch.mockResolvedValueOnce(matchData).mockResolvedValueOnce(matchData)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin/matches/3']}>
        <Routes>
          <Route path="/admin/matches/:id" element={<MatchConfigPage />} />
        </Routes>
      </MemoryRouter>
    )

    await screen.findByText(/configurar partida #3/i)

    const playerCard = screen.getByText('Jugadores').closest('.config-card')
    if (!playerCard) throw new Error('No se encontró el bloque de jugadores')
    await user.type(within(playerCard).getByPlaceholderText(/nombre del jugador/i), 'Carla')
    await user.click(within(playerCard).getByRole('button', { name: /añadir/i }))

    await waitFor(() => expect(mockCreatePlayer).toHaveBeenCalledWith(3, 'Carla'))
  })
})
