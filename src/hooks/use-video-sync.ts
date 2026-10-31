// oxlint-disable max-lines-per-function
import { type RefCallback, useCallback, useEffect, useState } from 'react'
import type { ImageMetadata } from '../utils/image.utils'
import { maxVideoDrift } from '../utils/video.utils'

type UseVideoSyncReturn = {
  currentTime: number
  canPlay: boolean
  duration: number
  isPlaying: boolean
  leftVideoRef: RefCallback<HTMLVideoElement>
  rightVideoRef: RefCallback<HTMLVideoElement>
  seek: (time: number) => void
  togglePlay: () => Promise<void>
}

// the shortest media rules the shared timeline
function getSharedDuration(videoDuration: number | undefined, sources: { left: ImageMetadata | undefined; right: ImageMetadata | undefined }): number {
  const durations = [videoDuration, sources.left?.frameSource?.duration, sources.right?.frameSource?.duration].filter(value => value !== undefined)
  return durations.length > 0 ? Math.min(...durations) : 0
}

/**
 * Keep the left and right videos on the same timeline : one play/pause, one seek.
 * Videos the browser can't play have no element, they only contribute their duration and follow the seek time.
 * @param sources the left and right media metadata, a new metadata means new media and a fresh timeline
 * @param sources.left the left media metadata
 * @param sources.right the right media metadata
 * @returns refs to attach to the video elements and the shared playback state
 */
export function useVideoSync(sources: { left: ImageMetadata | undefined; right: ImageMetadata | undefined }): UseVideoSyncReturn {
  // callback refs stored in state, so listeners are re-bound when a video element mounts or unmounts
  const [leftVideo, setLeftVideo] = useState<HTMLVideoElement | undefined>(undefined)
  const [rightVideo, setRightVideo] = useState<HTMLVideoElement | undefined>(undefined)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)

  const [previousSources, setPreviousSources] = useState(sources)
  // new media means a fresh timeline, reset during render rather than in an effect
  if (previousSources.left !== sources.left || previousSources.right !== sources.right) {
    setPreviousSources(sources)
    setCurrentTime(0)
    setVideoDuration(undefined)
    setIsPlaying(false)
  }

  const duration = getSharedDuration(videoDuration, sources)

  const leftVideoRef = useCallback((node: HTMLVideoElement | null) => setLeftVideo(node ?? undefined), [])
  const rightVideoRef = useCallback((node: HTMLVideoElement | null) => setRightVideo(node ?? undefined), [])

  const getVideos = useCallback(() => [leftVideo, rightVideo].filter(video => video !== undefined), [leftVideo, rightVideo])

  useEffect(() => {
    const videos = [leftVideo, rightVideo].filter(video => video !== undefined)
    const [primary] = videos
    if (!primary) return () => undefined
    const updateDuration = () => {
      const loadedDurations = videos.map(video => video.duration).filter(value => Number.isFinite(value))
      setVideoDuration(loadedDurations.length > 0 ? Math.min(...loadedDurations) : undefined)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(primary.currentTime)
      for (const video of videos) if (video !== primary && Math.abs(video.currentTime - primary.currentTime) > maxVideoDrift) video.currentTime = primary.currentTime
    }
    const handleEnded = () => {
      for (const video of videos) video.currentTime = 0
      if (videos.length > 0) void Promise.all(videos.map(video => video.play()))
    }
    for (const video of videos) if (video.readyState > 0) video.dispatchEvent(new Event('loadedmetadata'))
    for (const video of videos) video.addEventListener('loadedmetadata', updateDuration)
    primary.addEventListener('timeupdate', handleTimeUpdate)
    primary.addEventListener('ended', handleEnded)
    return () => {
      for (const video of videos) video.removeEventListener('loadedmetadata', updateDuration)
      primary.removeEventListener('timeupdate', handleTimeUpdate)
      primary.removeEventListener('ended', handleEnded)
    }
  }, [leftVideo, rightVideo])

  const seek = useCallback(
    (time: number) => {
      for (const video of getVideos()) video.currentTime = time
      setCurrentTime(time)
    },
    [getVideos],
  )

  const togglePlay = useCallback(async () => {
    const videos = getVideos()
    if (isPlaying) {
      for (const video of videos) video.pause()
      setIsPlaying(false)
      return
    }
    // align them before starting so they begin together
    const [primary] = videos
    if (primary) for (const video of videos) video.currentTime = primary.currentTime
    setIsPlaying(true)
    try {
      await Promise.all(videos.map(video => video.play()))
    } catch {
      setIsPlaying(false)
    }
  }, [getVideos, isPlaying])

  return { canPlay: !sources.left?.frameSource && !sources.right?.frameSource, currentTime, duration, isPlaying, leftVideoRef, rightVideoRef, seek, togglePlay }
}
