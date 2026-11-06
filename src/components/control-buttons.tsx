import { RotateCcw, Upload } from 'lucide-react'
// oxlint-disable id-length
import { cn } from '../utils/cn.utils'
import type { ContestState } from '../utils/comparison.utils'
import { useMediaMode } from '../utils/media-mode.utils'
import type { VideoSide } from '../utils/video.utils'
import { ShiftButtons } from './shift-buttons'
import { Button } from './ui/button'

type ControlButtonsProps = {
  contestState: ContestState | undefined
  onLeftImageUpload: (e: { target: { files?: FileList | null } }) => void
  onReset: () => void
  onRightImageUpload: (e: { target: { files?: FileList | null } }) => void
  onShift?: (side: VideoSide, delta: number) => void
}

export function ControlButtons({ contestState, onLeftImageUpload, onReset, onRightImageUpload, onShift }: ControlButtonsProps) {
  const mediaName = useMediaMode()
  const isContestMode = contestState !== undefined && !contestState.isComplete
  const isContestComplete = contestState?.isComplete ?? false
  const showShift = mediaName === 'video' && onShift !== undefined && !isContestMode && !isContestComplete
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4')} data-testid="control-buttons">
      {showShift && <ShiftButtons onShift={onShift} side="left" />}
      {/* v8 ignore start -- @preserve */}
      <div className={cn((isContestMode || isContestComplete) && 'hidden')}>
        <label className="cursor-pointer" htmlFor="left-upload">
          <Button name="left-upload" onClick={() => document.querySelector<HTMLButtonElement>('#left-upload')?.click()}>
            <Upload />
            Change left {mediaName}
          </Button>
        </label>
        <input accept="image/*,video/*" className="hidden" data-testid="left-upload-input" id="left-upload" onChange={onLeftImageUpload} type="file" />
      </div>
      {/* v8 ignore stop -- @preserve */}

      <Button name="reset" onClick={onReset} variant="outline">
        <RotateCcw />
        {isContestMode || isContestComplete ? 'Exit contest' : 'Reset view'}
      </Button>

      {/* v8 ignore start -- @preserve */}
      <div className={cn((isContestMode || isContestComplete) && 'hidden')}>
        <label className="cursor-pointer" htmlFor="right-upload">
          <Button name="right-upload" onClick={() => document.querySelector<HTMLButtonElement>('#right-upload')?.click()}>
            <Upload />
            Change right {mediaName}
          </Button>
        </label>
        <input accept="image/*,video/*" className="hidden" data-testid="right-upload-input" id="right-upload" onChange={onRightImageUpload} type="file" />
      </div>
      {/* v8 ignore stop -- @preserve */}
      {showShift && <ShiftButtons onShift={onShift} side="right" />}
    </div>
  )
}
