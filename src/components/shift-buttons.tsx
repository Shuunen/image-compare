import { frameDuration, type VideoSide } from '../utils/video.utils'
import { Button } from './ui/button'

const shiftSteps = [
  { delta: -10, label: '-10s' },
  { delta: -1, label: '-1s' },
  { delta: -frameDuration, label: '-1f' },
  { delta: frameDuration, label: '+1f' },
  { delta: 1, label: '+1s' },
  { delta: 10, label: '+10s' },
] as const

// moves one video alone, the shift is kept so both stay in sync wherever the user seeks
export function ShiftButtons({ onShift, side }: { onShift: (side: VideoSide, delta: number) => void; side: VideoSide }) {
  return (
    <div className="flex gap-1" data-testid={`shift-${side}`}>
      {shiftSteps.map(({ delta, label }) => (
        <Button className="px-2 text-xs" data-testid={`shift-${side}-${label}`} key={label} name={`shift-${side}-${label}`} onClick={() => onShift(side, delta)} title={`Move the ${side} video by ${label}`} variant="secondary">
          {label}
        </Button>
      ))}
    </div>
  )
}
