const secondsInMinute = 60
const twoDigits = 2

export const maxVideoDrift = 0.15

export function formatVideoTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / secondsInMinute)
  const rest = total % secondsInMinute
  return `${minutes}:${String(rest).padStart(twoDigits, '0')}`
}

export type VideoSide = 'left' | 'right'

const framesPerSecond = 24

/** one frame at 24 fps, the browser doesn't tell the real frame rate */
export const frameDuration = 1 / framesPerSecond

/**
 * Clamp a time inside a video, an unknown duration only clamps the start.
 * @param time the wanted time in seconds
 * @param duration the video duration in seconds
 * @returns a time the video can show
 */
export function clampVideoTime(time: number, duration: number): number {
  const end = Number.isFinite(duration) ? duration : Number.POSITIVE_INFINITY
  return Math.min(Math.max(0, time), end)
}
