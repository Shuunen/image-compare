import { fireEvent, render, screen } from '@testing-library/react'
import { VideoControl } from './video-control'

describe('video-control', () => {
  const props = { canPlay: true, currentTime: 65, duration: 125, isPlaying: false, onSeek: vi.fn<(time: number) => void>(), onTogglePlay: vi.fn<() => void>() }

  it('VideoControl A should display the formatted time', () => {
    render(<VideoControl {...props} />)
    expect(screen.getByTestId('video-time')).toHaveTextContent('1:05 / 2:05')
  })

  it('VideoControl B should toggle play on button click', () => {
    render(<VideoControl {...props} />)
    fireEvent.click(screen.getByTestId('video-play-pause'))
    expect(props.onTogglePlay).toHaveBeenCalledOnce()
  })

  it('VideoControl D should hide the play button when playback is not possible', () => {
    render(<VideoControl {...props} canPlay={false} />)
    expect(screen.queryByTestId('video-play-pause')).toBeNull()
  })

  it('VideoControl C should seek when the slider moves', () => {
    render(<VideoControl {...props} />)
    fireEvent.change(screen.getByTestId('video-seek'), { target: { value: '30' } })
    expect(props.onSeek).toHaveBeenCalledWith(30)
  })
})
