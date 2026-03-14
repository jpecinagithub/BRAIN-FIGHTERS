import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { RequireAuth } from '../components/RequireAuth'

const mockUseAuth = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('RequireAuth', () => {
  it('redirige al login si no hay sesión', async () => {
    mockUseAuth.mockReturnValue({ accessToken: null, admin: null })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <div>Private</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Login')).toBeInTheDocument()
  })

  it('renderiza el contenido cuando hay sesión', () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token', admin: { id: 1, email: 'a@b.com' } })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <div>Private</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Private')).toBeInTheDocument()
  })
})
