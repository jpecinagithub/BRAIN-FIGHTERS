import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

const mockLogin = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('inicia sesión y navega al panel', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin Screen</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@demo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(mockLogin).toHaveBeenCalledWith('admin@demo.com', 'password123')
    expect(await screen.findByText('Admin Screen')).toBeInTheDocument()
  })

  it('muestra error cuando falla el login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'))
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin Screen</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@demo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })
})
