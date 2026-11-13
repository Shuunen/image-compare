import type { FFFSType, FFmpeg } from '@ffmpeg/ffmpeg'

type LogListener = (event: { message: string }) => void

const defaultLogs = ['  Duration: 01:02:03.50, start: 0.000000, bitrate: 1000 kb/s', '  Stream #0:0: Video: h264, yuv420p, 1920x1080 [SAR 1:1 DAR 16:9], 24 fps']
const mocks = vi.hoisted(() => ({ ffmpeg: undefined as unknown, loadCount: 0 }))

// the wasm core is never fetched in tests
vi.mock(import('@ffmpeg/core?url'), () => ({ default: 'core.js' }))
vi.mock(import('@ffmpeg/core/wasm?url'), () => ({ default: 'core.wasm' }))
vi.mock(import('@ffmpeg/ffmpeg'), () => ({ FFFSType: { WORKERFS: 'WORKERFS' }, FFmpeg: vi.fn<() => unknown>(createFfmpeg) }) as unknown as { FFFSType: typeof FFFSType; FFmpeg: typeof FFmpeg })

// a constructor returning the shared mock, so `new FFmpeg()` gives the instance of the test
function createFfmpeg() {
  mocks.loadCount += 1
  return mocks.ffmpeg
}

function createFfmpegMock(logs: string[]) {
  const listeners = new Set<LogListener>()
  return {
    createDir: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    deleteFile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    exec: vi.fn<(args: string[]) => Promise<number>>(() => {
      for (const listener of listeners) for (const message of logs) listener({ message })
      return Promise.resolve(1)
    }),
    load: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    mount: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    off: vi.fn<(event: string, listener: LogListener) => void>((_event, listener) => {
      listeners.delete(listener)
    }),
    on: vi.fn<(event: string, listener: LogListener) => void>((_event, listener) => {
      listeners.add(listener)
    }),
    readFile: vi.fn<() => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array([1, 2, 3])),
  }
}

// each test gets a fresh module, so the cached ffmpeg instance and mount ids never leak between tests
async function loadUtils(logs = defaultLogs) {
  vi.resetModules()
  mocks.loadCount = 0
  const ffmpeg = createFfmpegMock(logs)
  mocks.ffmpeg = ffmpeg
  const utils = await import('./ffmpeg.utils')
  return { ...utils, ffmpeg }
}

describe('ffmpeg utils', () => {
  it('probeVideo A should read the duration and the size from the ffmpeg logs', async () => {
    const { ffmpeg, probeVideo } = await loadUtils()
    const file = new File(['video'], 'clip.mkv')
    const probe = await probeVideo(file)
    expect(probe).toStrictEqual({ duration: 3723.5, height: 1080, width: 1920 })
    expect(ffmpeg.load).toHaveBeenCalledWith({ coreURL: 'core.js', wasmURL: 'core.wasm' })
    expect(ffmpeg.off).toHaveBeenCalledOnce()
  })

  it('probeVideo A2 should mount the file and ask ffmpeg for its infos', async () => {
    const { ffmpeg, probeVideo } = await loadUtils()
    const file = new File(['video'], 'clip.mkv')
    await probeVideo(file)
    expect(ffmpeg.createDir).toHaveBeenCalledWith('/input-0')
    expect(ffmpeg.mount).toHaveBeenCalledWith('WORKERFS', { files: [file] }, '/input-0')
    expect(ffmpeg.exec).toHaveBeenCalledWith(['-i', '/input-0/clip.mkv'])
  })

  it('probeVideo B should mount a file only once and load ffmpeg only once', async () => {
    const { ffmpeg, probeVideo } = await loadUtils()
    const file = new File(['video'], 'clip.mkv')
    await probeVideo(file)
    await probeVideo(file)
    await probeVideo(new File(['other'], 'other.mkv'))
    expect(mocks.loadCount).toBe(1)
    expect(ffmpeg.mount).toHaveBeenCalledTimes(2)
    expect(ffmpeg.createDir).toHaveBeenLastCalledWith('/input-1')
  })

  it('probeVideo C should fail when the logs hold no video infos', async () => {
    const { ffmpeg, probeVideo } = await loadUtils([])
    await expect(probeVideo(new File(['video'], 'clip.mkv'))).rejects.toThrow('Could not read the video infos')
    expect(ffmpeg.off).toHaveBeenCalledOnce()
  })

  it('probeVideo D should fail when the duration is there but not the size', async () => {
    const { probeVideo } = await loadUtils(['Duration: 00:00:10.00'])
    await expect(probeVideo(new File(['video'], 'clip.mkv'))).rejects.toThrow('Could not read the video infos')
  })

  it('probeVideo E should retry loading ffmpeg after a failed load', async () => {
    const { ffmpeg, probeVideo } = await loadUtils()
    ffmpeg.load.mockRejectedValueOnce(new Error('offline'))
    await expect(probeVideo(new File(['video'], 'clip.mkv'))).rejects.toThrow('offline')
    await expect(probeVideo(new File(['video'], 'clip.mkv'))).resolves.toHaveProperty('width', 1920)
    expect(mocks.loadCount).toBe(2)
  })

  it('extractFrame A should return the jpeg of the frame and clean the output file', async () => {
    const { extractFrame, ffmpeg } = await loadUtils()
    ffmpeg.exec.mockResolvedValue(0)
    const frame = await extractFrame(new File(['video'], 'clip.mkv'), 1.23456)
    expect(frame).toBeInstanceOf(Blob)
    expect(frame).toHaveProperty('type', 'image/jpeg')
    expect(ffmpeg.exec).toHaveBeenCalledWith(['-ss', '1.235', '-i', '/input-0/clip.mkv', '-map', '0:v:0', '-an', '-sn', '-frames:v', '1', '-y', 'frame.jpg'])
    expect(ffmpeg.readFile).toHaveBeenCalledWith('frame.jpg')
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith('frame.jpg')
  })

  it('extractFrame B should do nothing when already aborted', async () => {
    const { extractFrame, ffmpeg } = await loadUtils()
    const controller = new globalThis.AbortController()
    controller.abort()
    const frame = await extractFrame(new File(['video'], 'clip.mkv'), 0, controller.signal)
    expect(frame).toBeUndefined()
    expect(ffmpeg.exec).not.toHaveBeenCalled()
  })

  it('extractFrame C should fail when ffmpeg exits with an error', async () => {
    const { extractFrame, ffmpeg } = await loadUtils()
    ffmpeg.exec.mockResolvedValue(1)
    await expect(extractFrame(new File(['video'], 'clip.mkv'), 0)).rejects.toThrow('ffmpeg exited with code 1')
    expect(ffmpeg.readFile).not.toHaveBeenCalled()
  })

  it('extractFrame D should run the jobs one after the other even when one fails', async () => {
    const { extractFrame, ffmpeg } = await loadUtils()
    const order: string[] = []
    ffmpeg.exec.mockImplementationOnce(() => {
      order.push('first')
      return Promise.resolve(1)
    })
    ffmpeg.exec.mockImplementationOnce(() => {
      order.push('second')
      return Promise.resolve(0)
    })
    const file = new File(['video'], 'clip.mkv')
    const first = extractFrame(file, 0)
    const second = extractFrame(file, 1)
    await expect(first).rejects.toThrow('ffmpeg exited with code 1')
    await expect(second).resolves.toBeInstanceOf(Blob)
    expect(order).toStrictEqual(['first', 'second'])
  })
})
