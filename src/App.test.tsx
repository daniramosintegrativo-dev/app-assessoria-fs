import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('mostra o nome da assessoria', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Físico Sagrado' })).toBeInTheDocument()
  })

  it('mostra a logo com texto alternativo', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /logo físico sagrado/i })).toBeInTheDocument()
  })
})
