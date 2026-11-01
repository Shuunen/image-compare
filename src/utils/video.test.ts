import { formatVideoTime } from './video.utils'

describe('video utils', () => {
  it('formatVideoTime A should format seconds as m:ss', () => {
    expect(formatVideoTime(65.9)).toBe('1:05')
  })

  it('formatVideoTime B should clamp negative values', () => {
    expect(formatVideoTime(-3)).toBe('0:00')
  })
})
