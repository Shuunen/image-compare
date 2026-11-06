// oxlint-disable max-lines-per-function
import { type RefCallback, useCallback, useEffect, useRef, useState } from 'react'
import type { ImageMetadata } from '../utils/image.utils'
import { clampVideoTime, maxVideoDrift, type VideoSide } from '../utils/video.utils'

// how far each video is moved from the shared timeline, to line up videos that differ by an intro for example
type VideoOffsets = Record<VideoSide, number>

const noOffsets: VideoOffsets = { left: 0, right: 0 }

type SideVideo = { side: VideoSide; video: HTMLVideoElement }

type UseVideoSyncReturn = {
  currentTime: number
  canPlay: boolean
  duration: number
  isPlaying: boolean
  leftVideoRef: RefCallback<HTMLVideoElement>
  offsets: VideoOffsets
  rightVideoRef: RefCallback<HTMLVideoElement>
  seek: (time: number) => void
  shift: (side: VideoSide, delta: number) => void
  togglePlay: () => Promise<void>
}

// the shortest media rules the shared timeline
function getSharedDuration(videoDuration: number | undefined, sources: { left: ImageMetadata | undefined; right: ImageMetadata | undefined }): number {
  const durations = [videoDuration, sources.left?.frameSource?.duration, sources.right?.frameSource?.duration].filter(value => value !== undefined)
  return durations.length > 0 ? Math.min(...durations) : 0
}

// new media means a fresh timeline, the video that stays must not keep playing from its old position
function useRewindOnNewMedia(sources: unknown, getVideos: () => HTMLVideoElement[]) {
  const rewoundSourcesRef = useRef(sources)
  useEffect(() => {
    if (rewoundSourcesRef.current === sources) return
    rewoundSourcesRef.current = sources
    for (const video of getVideos()) {
      video.pause()
      video.currentTime = 0
    }
  }, [getVideos, sources])
}

// callback refs stored in state, so listeners are re-bound when a video element mounts or unmounts
function useSideVideos() {
  const [leftVideo, setLeftVideo] = useState<HTMLVideoElement | undefined>(undefined)
  const [rightVideo, setRightVideo] = useState<HTMLVideoElement | undefined>(undefined)
  const leftVideoRef = useCallback((node: HTMLVideoElement | null) => setLeftVideo(node ?? undefined), [])
  const rightVideoRef = useCallback((node: HTMLVideoElement | null) => setRightVideo(node ?? undefined), [])
  const getSideVideos = useCallback(() => {
    const sideVideos: SideVideo[] = []
    if (leftVideo) sideVideos.push({ side: 'left', video: leftVideo })
    if (rightVideo) sideVideos.push({ side: 'right', video: rightVideo })
    return sideVideos
  }, [leftVideo, rightVideo])
  const getVideos = useCallback(() => getSideVideos().map(({ video }) => video), [getSideVideos])
  return { getSideVideos, getVideos, leftVideoRef, rightVideoRef }
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
  const { getSideVideos, getVideos, leftVideoRef, rightVideoRef } = useSideVideos()
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined)
  const [isPlaying, setIsPlaying] = useState(false)
  const [offsets, setOffsets] = useState<VideoOffsets>(noOffsets)

  const [previousSources, setPreviousSources] = useState(sources)
  // new media means a fresh timeline, reset during render rather than in an effect
  if (previousSources.left !== sources.left || previousSources.right !== sources.right) {
    setPreviousSources(sources)
    setCurrentTime(0)
    setVideoDuration(undefined)
    setIsPlaying(false)
    setOffsets(noOffsets)
  }

  const duration = getSharedDuration(videoDuration, sources)

  useRewindOnNewMedia(previousSources, getVideos)

  useEffect(() => {
    const sideVideos = getSideVideos()
    const [primary] = sideVideos
    if (!primary) return () => undefined
    const videos = sideVideos.map(({ video }) => video)
    const updateDuration = () => {
      const loadedDurations = videos.map(video => video.duration).filter(value => Number.isFinite(value))
      setVideoDuration(loadedDurations.length > 0 ? Math.min(...loadedDurations) : undefined)
    }
    const handleTimeUpdate = () => {
      const sharedTime = primary.video.currentTime - offsets[primary.side]
      setCurrentTime(sharedTime)
      for (const { side, video } of sideVideos) {
        const wanted = clampVideoTime(sharedTime + offsets[side], video.duration)
        if (video !== primary.video && Math.abs(video.currentTime - wanted) > maxVideoDrift) video.currentTime = wanted
      }
    }
    const handleEnded = async () => {
      for (const { side, video } of sideVideos) video.currentTime = clampVideoTime(offsets[side], video.duration)
      try {
        await Promise.all(videos.map(video => video.play()))
      } catch {
        setIsPlaying(false)
      }
    }
    for (const video of videos) if (video.readyState > 0) video.dispatchEvent(new Event('loadedmetadata'))
    for (const video of videos) video.addEventListener('loadedmetadata', updateDuration)
    primary.video.addEventListener('timeupdate', handleTimeUpdate)
    primary.video.addEventListener('ended', handleEnded)
    return () => {
      for (const video of videos) video.removeEventListener('loadedmetadata', updateDuration)
      primary.video.removeEventListener('timeupdate', handleTimeUpdate)
      primary.video.removeEventListener('ended', handleEnded)
    }
  }, [getSideVideos, offsets])

  const seek = useCallback(
    (time: number) => {
      for (const { side, video } of getSideVideos()) video.currentTime = clampVideoTime(time + offsets[side], video.duration)
      setCurrentTime(time)
    },
    [getSideVideos, offsets],
  )

  // the shift is kept until new media are loaded, so seeking elsewhere keeps the videos in sync
  const shift = useCallback(
    (side: VideoSide, delta: number) => {
      const next = offsets[side] + delta
      setOffsets({ ...offsets, [side]: next })
      const target = getSideVideos().find(item => item.side === side)
      if (target) target.video.currentTime = clampVideoTime(currentTime + next, target.video.duration)
    },
    [currentTime, getSideVideos, offsets],
  )

  const togglePlay = useCallback(async () => {
    const sideVideos = getSideVideos()
    const videos = sideVideos.map(item => item.video)
    if (isPlaying) {
      for (const video of videos) video.pause()
      setIsPlaying(false)
      return
    }
    // align them before starting so they begin together
    const [primary] = sideVideos
    if (primary) {
      const sharedTime = primary.video.currentTime - offsets[primary.side]
      for (const { side, video } of sideVideos) video.currentTime = clampVideoTime(sharedTime + offsets[side], video.duration)
    }
    setIsPlaying(true)
    try {
      await Promise.all(videos.map(video => video.play()))
    } catch {
      setIsPlaying(false)
    }
  }, [getSideVideos, isPlaying, offsets])

  return { canPlay: !sources.left?.frameSource && !sources.right?.frameSource, currentTime, duration, isPlaying, leftVideoRef, offsets, rightVideoRef, seek, shift, togglePlay }
}
