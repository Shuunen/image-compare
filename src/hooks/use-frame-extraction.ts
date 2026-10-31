import { useEffect, useRef, useState } from 'react'
import { extractFrame } from '../utils/ffmpeg.utils'
import type { FrameSource, ImageMetadata } from '../utils/image.utils'
import { logger } from '../utils/logger.utils'

// the very end of a video has no frame to decode
const lastFrameMargin = 0.05

type FrameSide = {
  metadata: ImageMetadata | undefined
  onFrame: (url: string) => void
}

/**
 * Keep the displayed image of an unplayable video on the shared seek time.
 * @param currentTime the shared seek time in seconds
 * @param side the media metadata and the setter of its displayed image
 * @returns true while the frame of the current seek time is not displayed yet, extracted frames are given to the side setter
 */
function useSideFrames(currentTime: number, side: FrameSide): boolean {
  const { metadata, onFrame } = side
  const frameSource = metadata?.frameSource
  const currentUrlRef = useRef<string | undefined>(undefined)
  // the last extraction that ended, derived rather than set in the effect so loading starts with the seek
  const [settled, setSettled] = useState<{ source: FrameSource | undefined; time: number }>({ source: undefined, time: -1 })

  useEffect(() => {
    if (!frameSource) return () => undefined
    const controller = new globalThis.AbortController()
    const extract = async () => {
      try {
        const frame = await extractFrame(frameSource.file, Math.min(currentTime, Math.max(0, frameSource.duration - lastFrameMargin)), controller.signal)
        if (!frame || controller.signal.aborted) return
        const previousUrl = currentUrlRef.current
        currentUrlRef.current = globalThis.URL.createObjectURL(frame)
        onFrame(currentUrlRef.current)
        if (previousUrl) globalThis.URL.revokeObjectURL(previousUrl)
      } catch (error) {
        logger.error('frame extraction failed', error)
      }
      if (!controller.signal.aborted) setSettled({ source: frameSource, time: currentTime })
    }
    void extract()
    return () => controller.abort()
  }, [currentTime, frameSource, onFrame])

  return frameSource !== undefined && (settled.source !== frameSource || settled.time !== currentTime)
}

export function useFrameExtraction(currentTime: number, left: FrameSide, right: FrameSide): { isLeftExtracting: boolean; isRightExtracting: boolean } {
  const isLeftExtracting = useSideFrames(currentTime, left)
  const isRightExtracting = useSideFrames(currentTime, right)
  return { isLeftExtracting, isRightExtracting }
}
