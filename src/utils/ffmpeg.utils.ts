import { FFFSType, FFmpeg } from '@ffmpeg/ffmpeg'

export type VideoProbe = { duration: number; height: number; width: number }

const secondsInMinute = 60
const secondsInHour = 3600
const frameTimePrecision = 3
const mountPoints = new WeakMap<File, string>()
let nextMountId = 0
let ffmpegPromise: Promise<FFmpeg> | undefined = undefined
let queue: Promise<unknown> = Promise.resolve()

// the ~30MB wasm core is only fetched the first time a video the browser can't play is dropped
async function loadFfmpeg(): Promise<FFmpeg> {
  const [{ default: coreURL }, { default: wasmURL }] = await Promise.all([import('@ffmpeg/core?url'), import('@ffmpeg/core/wasm?url')])
  const ffmpeg = new FFmpeg()
  await ffmpeg.load({ coreURL, wasmURL })
  return ffmpeg
}

async function loadFfmpegOnce(): Promise<FFmpeg> {
  try {
    return await loadFfmpeg()
  } catch (error) {
    // a failed load (offline, flaky network) must not be cached, the next video can try again
    ffmpegPromise = undefined
    throw error
  }
}

function getFfmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= loadFfmpegOnce()
  return ffmpegPromise
}

// ffmpeg handles a single command at a time
function enqueue<Result>(job: () => Promise<Result>): Promise<Result> {
  const result = (async () => {
    await queue.catch(() => undefined)
    return job()
  })()
  queue = result
  return result
}

// WORKERFS exposes the file to ffmpeg without copying it in memory
async function getInputPath(ffmpeg: FFmpeg, file: File): Promise<string> {
  let mountPoint = mountPoints.get(file)
  if (!mountPoint) {
    mountPoint = `/input-${nextMountId}`
    nextMountId += 1
    await ffmpeg.createDir(mountPoint)
    await ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, mountPoint)
    mountPoints.set(file, mountPoint)
  }
  return `${mountPoint}/${file.name}`
}

function parseDuration(logs: string): number {
  const groups = /Duration: (?<hours>\d+):(?<minutes>\d+):(?<seconds>\d+(?:\.\d+)?)/.exec(logs)?.groups
  if (!groups) return 0
  return Number(groups.hours) * secondsInHour + Number(groups.minutes) * secondsInMinute + Number(groups.seconds)
}

function parseSize(logs: string): { height: number; width: number } {
  const groups = /Video:.*?\b(?<width>\d{2,5})x(?<height>\d{2,5})\b/.exec(logs)?.groups
  return { height: Number(groups?.height ?? 0), width: Number(groups?.width ?? 0) }
}

/**
 * Read the duration and size of a video the browser can't play.
 * @param file the video file
 * @returns the video duration in seconds and its size in pixels
 */
export function probeVideo(file: File): Promise<VideoProbe> {
  return enqueue(async () => {
    const ffmpeg = await getFfmpeg()
    const path = await getInputPath(ffmpeg, file)
    let logs = ''
    const onLog = ({ message }: { message: string }) => {
      logs += `${message}\n`
    }
    ffmpeg.on('log', onLog)
    try {
      // no output file : ffmpeg prints the streams infos then exits with an error, which is expected
      await ffmpeg.exec(['-i', path])
    } finally {
      ffmpeg.off('log', onLog)
    }
    const probe = { duration: parseDuration(logs), ...parseSize(logs) }
    if (probe.duration <= 0 || probe.width <= 0) throw new Error('Could not read the video infos')
    return probe
  })
}

/**
 * Decode a single frame, the rest of the video is never decoded.
 * @param file the video file
 * @param time the frame time in seconds
 * @param signal aborts the extraction if it has not started yet
 * @returns a jpeg of the frame, or undefined if aborted
 */
export function extractFrame(file: File, time: number, signal?: AbortSignal): Promise<Blob | undefined> {
  return enqueue(async () => {
    if (signal?.aborted) return undefined
    const ffmpeg = await getFfmpeg()
    const path = await getInputPath(ffmpeg, file)
    const outputName = 'frame.jpg'
    // -ss before -i seeks without decoding what comes before, only the video stream is needed
    // do not set the jpeg quality (-q:v) : it crashes the wasm build with "memory access out of bounds"
    const exitCode = await ffmpeg.exec(['-ss', time.toFixed(frameTimePrecision), '-i', path, '-map', '0:v:0', '-an', '-sn', '-frames:v', '1', '-y', outputName])
    if (exitCode !== 0) throw new Error(`ffmpeg exited with code ${exitCode}`)
    const data = await ffmpeg.readFile(outputName)
    await ffmpeg.deleteFile(outputName)
    return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
  })
}
