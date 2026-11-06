import { setMediaMode } from './media-mode.utils'

describe('media mode', () => {
  it('should switch the root mode and the document title', () => {
    setMediaMode('video')
    expect(document.documentElement.dataset.mode).toBe('video')
    expect(document.title).toBe('Video Compare')
    setMediaMode('image')
    expect(document.documentElement.dataset.mode).toBe('image')
    expect(document.title).toBe('Image Compare')
  })
})
