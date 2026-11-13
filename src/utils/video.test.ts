import { clampVideoTime, formatVideoTime } from './video.utils'

describe('video utils', () => {
  it('formatVideoTime A should format seconds as m:ss', () => {
    expect(formatVideoTime(65.9)).toBe('1:05')
  })

  it('formatVideoTime B should clamp negative values', () => {
    expect(formatVideoTime(-3)).toBe('0:00')
  })

  it('clampVideoTime A should clamp inside the duration', () => {
    expect(clampVideoTime(50, 10)).toBe(10)
    expect(clampVideoTime(-5, 10)).toBe(0)
  })

  it('clampVideoTime B should only clamp the start when the duration is unknown', () => {
    expect(clampVideoTime(50, Number.NaN)).toBe(50)
    expect(clampVideoTime(-5, Number.POSITIVE_INFINITY)).toBe(0)
  })
})
