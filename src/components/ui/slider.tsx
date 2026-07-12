import { cn } from 'shuutils'

type SliderProps = {
  className?: string
  max?: number
  min?: number
  onValueChange: (value: number[]) => void
  step?: number
  value: number[]
}

export function Slider({ className = '', max = 100, min = 0, onValueChange, step = 1, value }: SliderProps) {
  return (
    <input
      className={cn('h-1.5 w-full cursor-grab appearance-none rounded-full bg-accent-foreground/50 accent-primary', className)}
      max={max}
      min={min}
      onChange={event => onValueChange([Number(event.target.value)])}
      step={step}
      type="range"
      value={value[0] ?? 0}
    />
  )
}
