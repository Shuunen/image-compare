import { fireEvent, render, screen } from '@testing-library/react'
import { state } from '../utils/state.utils'
import { Settings } from './settings.tab'

describe('settings', () => {
  it('Settings A should render successfully', () => {
    const { container } = render(<Settings />)
    expect(container).toBeInstanceOf(HTMLElement)
  })

  it('Settings B should display settings title', () => {
    render(<Settings />)
    const title = screen.getByText('Settings')
    expect(title).toBeInstanceOf(HTMLElement)
  })

  it('Settings C should toggle the dark theme', () => {
    const initialDarkTheme = state.darkTheme
    render(<Settings />)
    const checkbox = screen.getByTestId('dark-theme-toggle')
    fireEvent.click(checkbox)
    expect(state.darkTheme).toBe(!initialDarkTheme)
    fireEvent.click(checkbox)
    expect(state.darkTheme).toBe(initialDarkTheme)
  })
})
