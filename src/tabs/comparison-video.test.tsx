import { render, screen } from '@testing-library/react'
import type { VideoProbe } from '../utils/ffmpeg.utils'
import type { ImageMetadata } from '../utils/image.utils'
import { Comparison } from './comparison.tab'

const mocks = vi.hoisted(() => ({ left: undefined as ImageMetadata | undefined, right: undefined as ImageMetadata | undefined }))

vi.mock(import('../hooks/use-image-state'), () => ({
  useImageState: () => ({
    leftImage: '/left.jpg',
    leftImageMetadata: mocks.left,
    rightImage: '/right.jpg',
    rightImageMetadata: mocks.right,
    setLeftImage: vi.fn<() => void>(),
    setLeftImageMetadata: vi.fn<() => void>(),
    setRightImage: vi.fn<() => void>(),
    setRightImageMetadata: vi.fn<() => void>(),
  }),
}))
vi.mock(import('../utils/ffmpeg.utils'), () => ({ extractFrame: vi.fn<() => Promise<Blob | undefined>>().mockResolvedValue(undefined), probeVideo: vi.fn<() => Promise<VideoProbe>>() }))

const baseMetadata: ImageMetadata = { filename: 'clip.mkv', height: 1080, size: 1, width: 1920 }
const frameSource = { duration: 10, file: new File(['video'], 'clip.mkv') }

describe('comparison with videos', () => {
  it('Comparison video A should not show the video control without video', () => {
    mocks.left = baseMetadata
    mocks.right = baseMetadata
    render(<Comparison />)
    expect(screen.queryByTestId('video-control')).toBeNull()
  })

  it.each([
    ['left video', { left: { ...baseMetadata, isVideo: true }, right: baseMetadata }],
    ['right video', { left: baseMetadata, right: { ...baseMetadata, isVideo: true } }],
    ['left frame source', { left: { ...baseMetadata, frameSource }, right: baseMetadata }],
    ['right frame source', { left: baseMetadata, right: { ...baseMetadata, frameSource } }],
  ])('Comparison video B should show the video control with a %s', (_name, metadata) => {
    mocks.left = metadata.left
    mocks.right = metadata.right
    render(<Comparison />)
    expect(screen.getByTestId('video-control')).toBeInstanceOf(HTMLElement)
  })
})
