import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import RegisterPage from '../pages/RegisterPage'

const mockRegister = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
  })

  it('crea el usuario y navega al panel', async () => {
    mockRegister.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<div>Admin Screen</div>} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@demo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(mockRegister).toHaveBeenCalledWith('admin@demo.com', 'password123')
    expect(await screen.findByText('Admin Screen')).toBeInTheDocument()
  })

  it('muestra error cuando falla el registro', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Error al crear usuario'))
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@demo.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'password123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(/error al crear usuario/i)).toBeInTheDocument()
  })
})
