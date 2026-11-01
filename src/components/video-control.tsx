import { Pause, Play } from 'lucide-react'
import { useMemo } from 'react'
import { formatVideoTime } from '../utils/video.utils'
import { Button } from './ui/button'
import { Slider } from './ui/slider'

type VideoControlProps = {
  canPlay: boolean
  currentTime: number
  duration: number
  isPlaying: boolean
  onSeek: (time: number) => void
  onTogglePlay: () => Promise<void> | void
}

export function VideoControl({ canPlay, currentTime, duration, isPlaying, onSeek, onTogglePlay }: VideoControlProps) {
  const value = useMemo(() => [currentTime], [currentTime])
  return (
    <div className="mb-8 flex items-center gap-4 px-2" data-testid="video-control">
      {canPlay && (
        <Button data-testid="video-play-pause" name="play-pause" onClick={onTogglePlay} variant="secondary">
          {isPlaying ? <Pause /> : <Play />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      )}
      <Slider className="w-full" max={duration} onValueChange={([time]) => onSeek(time ?? 0)} step={0.01} testId="video-seek" value={value} />
      <span className="text-sm whitespace-nowrap text-accent-foreground tabular-nums" data-testid="video-time">
        {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
      </span>
    </div>
  )
}
