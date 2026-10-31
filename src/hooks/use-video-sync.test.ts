import { act, renderHook } from '@testing-library/react'
import type { ImageMetadata } from '../utils/image.utils'
import { useVideoSync } from './use-video-sync'

// Value: protects=left and right videos share one seek, one play state and the shortest duration; fails_when=seek skips a video or a play rejection leaves isPlaying true; why_new=hooks have no tests and are excluded from coverage; seam=none; no_claim=real playback (happy-dom video, play mocked)

function createVideo(duration: number): HTMLVideoElement {
  const video = globalThis.document.createElement('video')
  Object.defineProperty(video, 'duration', { value: duration })
  return video
}

const leftMeta: ImageMetadata = { filename: 'a.mp4', height: 1, isVideo: true, size: 1, width: 1 }
const rightMeta: ImageMetadata = { filename: 'b.mp4', height: 1, isVideo: true, size: 1, width: 1 }

describe('use-video-sync', () => {
  it('useVideoSync A should seek both videos and expose the shortest duration', () => {
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: rightMeta }))
    const left = createVideo(10)
    const right = createVideo(8)
    act(() => {
      result.current.leftVideoRef(left)
      result.current.rightVideoRef(right)
    })
    act(() => result.current.seek(3))
    expect(left.currentTime).toBe(3)
    expect(right.currentTime).toBe(3)
    expect(result.current.currentTime).toBe(3)
    expect(result.current.canPlay).toBe(true)
  })

  it('useVideoSync B should stop playing when play is rejected', async () => {
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: rightMeta }))
    const left = createVideo(10)
    vi.spyOn(left, 'play').mockRejectedValue(new Error('blocked'))
    act(() => result.current.leftVideoRef(left))
    await act(async () => {
      await result.current.togglePlay()
    })
    expect(result.current.isPlaying).toBe(false)
  })

  it('useVideoSync C should disallow play and use the frame source duration for unplayable videos', () => {
    const frameMeta: ImageMetadata = { ...rightMeta, frameSource: { duration: 4, file: new File(['x'], 'b.mkv') } }
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: frameMeta }))
    expect(result.current.canPlay).toBe(false)
    expect(result.current.duration).toBe(4)
  })

  it('useVideoSync D should reset the timeline when the media change', () => {
    const { rerender, result } = renderHook(({ sources }) => useVideoSync(sources), { initialProps: { sources: { left: leftMeta, right: rightMeta } } })
    act(() => result.current.seek(5))
    rerender({ sources: { left: { ...leftMeta }, right: rightMeta } })
    expect(result.current.currentTime).toBe(0)
  })

  // Value: protects=the right video is pulled back to the left one only when it drifts past maxVideoDrift; fails_when=drift is not corrected or tiny drifts cause constant seeking; why_new=timeupdate sync path was never exercised; seam=none; no_claim=real decoding or timing
  it('useVideoSync E should correct only the drift beyond the limit on timeupdate', () => {
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: rightMeta }))
    const left = createVideo(10)
    const right = createVideo(10)
    act(() => {
      result.current.leftVideoRef(left)
      result.current.rightVideoRef(right)
    })
    left.currentTime = 5
    right.currentTime = 5.05
    act(() => {
      left.dispatchEvent(new Event('timeupdate'))
    })
    expect(right.currentTime).toBe(5.05)
    expect(result.current.currentTime).toBe(5)
    right.currentTime = 6
    act(() => {
      left.dispatchEvent(new Event('timeupdate'))
    })
    expect(right.currentTime).toBe(5)
  })

  // Value: protects=videos loop together from 0 when the primary ends; fails_when=ended leaves videos at the end or restarts only one; why_new=loop restart path was never exercised; seam=none; no_claim=real playback (play mocked)
  it('useVideoSync F should restart both videos from zero when the video ends', () => {
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: rightMeta }))
    const left = createVideo(10)
    const right = createVideo(10)
    const leftPlay = vi.spyOn(left, 'play').mockResolvedValue()
    const rightPlay = vi.spyOn(right, 'play').mockResolvedValue()
    act(() => {
      result.current.leftVideoRef(left)
      result.current.rightVideoRef(right)
    })
    left.currentTime = 10
    right.currentTime = 10
    act(() => {
      left.dispatchEvent(new Event('ended'))
    })
    expect(left.currentTime).toBe(0)
    expect(right.currentTime).toBe(0)
    expect(leftPlay).toHaveBeenCalledOnce()
    expect(rightPlay).toHaveBeenCalledOnce()
  })

  // Value: protects=the video that stays is paused and rewound when the other side gets new media; fails_when=it keeps playing from its old position with no way to stop it; why_new=replacing one side was never exercised; seam=none; no_claim=real playback (pause mocked)
  it('useVideoSync G should pause and rewind the remaining video when the other media is replaced', () => {
    const { rerender, result } = renderHook(({ sources }) => useVideoSync(sources), { initialProps: { sources: { left: leftMeta, right: rightMeta } } })
    const left = createVideo(10)
    const right = createVideo(10)
    const rightPause = vi.spyOn(right, 'pause').mockReturnValue(undefined)
    act(() => {
      result.current.leftVideoRef(left)
      result.current.rightVideoRef(right)
    })
    right.currentTime = 7
    rerender({ sources: { left: { ...leftMeta }, right: rightMeta } })
    expect(rightPause).toHaveBeenCalledWith()
    expect(right.currentTime).toBe(0)
  })

  // Value: protects=a blocked play when the video loops leaves the state paused; fails_when=isPlaying stays true after the restart play is rejected; why_new=the ended restart ignored play rejections; seam=none; no_claim=real playback (play mocked)
  it('useVideoSync H should stop playing when the restart after the end is rejected', async () => {
    const { result } = renderHook(() => useVideoSync({ left: leftMeta, right: rightMeta }))
    const left = createVideo(10)
    const play = vi.spyOn(left, 'play').mockResolvedValueOnce().mockRejectedValueOnce(new Error('blocked'))
    act(() => result.current.leftVideoRef(left))
    await act(async () => {
      await result.current.togglePlay()
    })
    expect(result.current.isPlaying).toBe(true)
    await act(async () => {
      left.dispatchEvent(new Event('ended'))
      await Promise.resolve()
    })
    expect(play).toHaveBeenCalledTimes(2)
    expect(result.current.isPlaying).toBe(false)
  })
})
