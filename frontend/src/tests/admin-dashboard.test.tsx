import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AdminDashboard from '../pages/AdminDashboard'

const mockUseAuth = vi.fn()
const mockGetMatches = vi.fn()
const mockCreateMatch = vi.fn()
const mockFinishMatch = vi.fn()
const mockDeleteMatch = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../api/matches', () => ({
  getMatches: (...args: unknown[]) => mockGetMatches(...args),
  createMatch: (...args: unknown[]) => mockCreateMatch(...args),
  finishMatch: (...args: unknown[]) => mockFinishMatch(...args),
  deleteMatch: (...args: unknown[]) => mockDeleteMatch(...args),
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ admin: { id: 1, email: 'admin@demo.com' }, logout: vi.fn() })
  })

  it('renderiza partidas y permite copiar la URL pública', async () => {
    const matches = [
      {
        id: 1,
        adminId: 1,
        status: 'active',
        publicCode: 'ABC123',
        createdAt: '2024-01-01',
        endedAt: null,
      },
    ]
    mockGetMatches.mockResolvedValueOnce(matches)
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    expect(await screen.findByText('Partida #1')).toBeInTheDocument()
    const copyButtons = screen.getAllByRole('button', { name: /copiar url/i })
    await user.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/play/ABC123`)
  })

  it('crea una partida y recarga la lista', async () => {
    const initialMatches = [
      {
        id: 1,
        adminId: 1,
        status: 'active',
        publicCode: 'AAA111',
        createdAt: '2024-01-01',
        endedAt: null,
      },
    ]
    const nextMatches = [
      ...initialMatches,
      {
        id: 2,
        adminId: 1,
        status: 'active',
        publicCode: 'BBB222',
        createdAt: '2024-01-02',
        endedAt: null,
      },
    ]

    mockGetMatches
      .mockResolvedValueOnce(initialMatches)
      .mockResolvedValueOnce(nextMatches)
    mockCreateMatch.mockResolvedValueOnce(nextMatches[1])
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    await screen.findByText('Partida #1')
    await user.click(screen.getByRole('button', { name: /crear nueva partida/i }))

    await waitFor(() => expect(mockCreateMatch).toHaveBeenCalled())
    expect(mockGetMatches).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Partida #2')).toBeInTheDocument()
  })
})
