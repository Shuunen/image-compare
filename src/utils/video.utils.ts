const secondsInMinute = 60
const twoDigits = 2

export const maxVideoDrift = 0.15

export function formatVideoTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / secondsInMinute)
  const rest = total % secondsInMinute
  return `${minutes}:${String(rest).padStart(twoDigits, '0')}`
}
