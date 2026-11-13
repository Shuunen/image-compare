import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { setMediaMode } from '../utils/media-mode.utils'
import { App } from './app.page'

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )
    expect(baseElement).toBeInstanceOf(HTMLElement)
  })

  it('should have a greeting', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    )
    expect(getAllByText('Image Compare').length).toBeGreaterThan(0)
  })

  it('should name the comparison tab after the video mode', () => {
    setMediaMode('video')
    const { getAllByText } = render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>,
    )
    expect(getAllByText('Video Compare').length).toBeGreaterThan(0)
    setMediaMode('image')
  })
})
