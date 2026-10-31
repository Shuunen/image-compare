import { logger } from './logger.utils'

const requiredFilesCount = 2

/** A video the browser can't play, only single frames are extracted from it */
export type FrameSource = {
  duration: number
  file: File
}

export type ImageMetadata = {
  filename: string
  frameSource?: FrameSource
  size: number
  width: number
  height: number
  isVideo?: boolean
}

export type ImageData = {
  url: string
  filename: string
}

export type ImageUpdateCallbacks = {
  onImageUpdate: (dataUrl: string) => void
  onMetadataUpdate?: (metadata: ImageMetadata) => void
  imageSide: 'left' | 'right'
}

export type TwoImagesUpdateCallbacks = {
  onLeftImageUpdate: (dataUrl: string) => void
  onRightImageUpdate: (dataUrl: string) => void
  onLeftMetadataUpdate?: (metadata: ImageMetadata) => void
  onRightMetadataUpdate?: (metadata: ImageMetadata) => void
}

export type MultipleImagesUpdateCallbacks = {
  onContestStart: (images: ImageData[]) => void
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mkv')
}

// browsers rarely accept the matroska mime type, but they play most mkv files (h264, vp9) when told it is webm
function getVideoBlob(file: File): Blob {
  const isMatroska = file.type === 'video/x-matroska' || file.name.toLowerCase().endsWith('.mkv')
  return isMatroska ? new Blob([file], { type: 'video/webm' }) : file
}

function readImageFile(file: File, onSuccess: (dataUrl: string) => void, onError: (error: string) => void): void {
  // videos can be huge, an object url avoids loading them in memory as a data url
  if (isVideoFile(file)) {
    onSuccess(globalThis.URL.createObjectURL(getVideoBlob(file)))
    return
  }
  const reader = new FileReader()
  // oxlint-disable-next-line prefer-add-event-listener
  reader.onload = event => {
    const result = event.target?.result
    /* v8 ignore next 2 -- @preserve */
    if (typeof result === 'string') onSuccess(result)
    else onError('Result is not a string.')
  }
  /* v8 ignore next 3 -- @preserve */
  // oxlint-disable-next-line prefer-add-event-listener
  reader.onerror = () => onError(reader.error?.message ?? 'Failed to read file.')
  reader.readAsDataURL(file)
}

function getImageDimensions(src: string): Promise<{ height: number; width: number }> {
  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const img = globalThis.document.createElement('img')
    img.addEventListener('load', () => resolve({ height: img.naturalHeight, width: img.naturalWidth }))
    /* v8 ignore start */
    img.addEventListener('error', () => reject(new Error('Failed to load image')))
    /* v8 ignore stop */
    img.src = src
  })
}

/* v8 ignore start */
function getVideoDimensions(src: string): Promise<{ height: number; width: number }> {
  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const video = globalThis.document.createElement('video')
    video.preload = 'metadata'
    video.addEventListener('loadedmetadata', () => resolve({ height: video.videoHeight, width: video.videoWidth }))
    video.addEventListener('error', () => reject(new Error('Failed to load video')))
    video.src = src
  })
}
/* v8 ignore stop */

async function getFileMetadata(file: File, url: string): Promise<ImageMetadata> {
  const isVideo = isVideoFile(file)
  const dimensions = await (isVideo ? getVideoDimensions(url) : getImageDimensions(url))
  return { filename: file.name, height: dimensions.height, isVideo, size: file.size, width: dimensions.width }
}

/* v8 ignore start */
// the browser can't play this video, so frames are extracted one at a time with ffmpeg wasm instead of converting the whole video
async function loadFrameSource(file: File): Promise<{ metadata: ImageMetadata; url: string }> {
  logger.info(`Your browser can't play "${file.name}", loading it frame by frame...`)
  const { extractFrame, probeVideo } = await import('./ffmpeg.utils')
  const { duration, height, width } = await probeVideo(file)
  const frame = await extractFrame(file, 0)
  if (!frame) throw new Error('No frame extracted')
  return { metadata: { filename: file.name, frameSource: { duration, file }, height, isVideo: false, size: file.size, width }, url: globalThis.URL.createObjectURL(frame) }
}
/* v8 ignore stop */

// metadata first so the viewer knows if it must render a video or an image, nothing is applied if the media can't be decoded
async function applyFile(file: File, url: string, callbacks: { onImageUpdate: (url: string) => void; onMetadataUpdate: ((metadata: ImageMetadata) => void) | undefined }): Promise<boolean> {
  let mediaUrl = url
  let metadata: ImageMetadata | undefined = undefined
  try {
    metadata = await getFileMetadata(file, mediaUrl)
  } catch {
    /* v8 ignore start -- @preserve */
    if (isVideoFile(file))
      try {
        const frameSource = await loadFrameSource(file)
        ;({ metadata, url: mediaUrl } = frameSource)
      } catch (error) {
        logger.error('frame extraction failed', error)
      }
    /* v8 ignore stop -- @preserve */
  }
  if (!metadata) {
    /* v8 ignore next 2 -- @preserve */
    logger.showError(`Cannot read "${file.name}", the file format or its codec is probably unsupported.`)
    return false
  }
  callbacks.onMetadataUpdate?.(metadata)
  callbacks.onImageUpdate(mediaUrl)
  return true
}

export async function fetchImageMetadata(url: string): Promise<ImageMetadata> {
  const response = await fetch(url)
  const blob = await response.blob()
  const filename = url.split('/').pop() || 'unknown'
  const objectUrl = globalThis.URL.createObjectURL(blob)
  try {
    const dimensions = await getImageDimensions(objectUrl)
    return { filename, height: dimensions.height, size: blob.size, width: dimensions.width }
  } finally {
    globalThis.URL.revokeObjectURL(objectUrl)
  }
}

export function handleSingleFileUpload(file: File | undefined, callbacks: ImageUpdateCallbacks): void {
  if (!file) return
  const { imageSide, onImageUpdate, onMetadataUpdate } = callbacks
  readImageFile(
    file,
    async dataUrl => {
      if (await applyFile(file, dataUrl, { onImageUpdate, onMetadataUpdate })) logger.info(`${imageSide === 'left' ? 'Left' : 'Right'} image updated via upload.`)
    },
    /* v8 ignore next 3 */
    () => {
      logger.showError(`Failed to read ${imageSide} image file: result is not a string.`)
    },
  )
}

function loadImagesForContest(files: FileList, callbacks: MultipleImagesUpdateCallbacks): void {
  const { onContestStart } = callbacks
  const imageData: ImageData[] = []
  let loadedCount = 0
  const filesArray = Array.from(files)
  for (const file of filesArray)
    readImageFile(
      file,
      // oxlint-disable-next-line no-loop-func
      dataUrl => {
        imageData.push({ filename: file.name, url: dataUrl })
        loadedCount += 1
        if (loadedCount === files.length) {
          onContestStart(imageData)
          logger.info(`Contest mode started with ${files.length} images.`)
        }
      },
      /* v8 ignore next */
      () => logger.showError('Failed to read one of the dropped files.'),
    )
}

/* v8 ignore start */

function loadTwoImages(files: FileList, callbacks: TwoImagesUpdateCallbacks): void {
  const { onLeftImageUpdate, onLeftMetadataUpdate, onRightImageUpdate, onRightMetadataUpdate } = callbacks
  const [file1, file2] = Array.from(files)
  if (!file1 || !file2) return
  readImageFile(
    file1,
    async dataUrl => {
      if (!(await applyFile(file1, dataUrl, { onImageUpdate: onLeftImageUpdate, onMetadataUpdate: onLeftMetadataUpdate }))) return
      logger.info('Left image updated via drag and drop.')
    },
    () => logger.showError('Failed to read first dropped file: result is not a string.'),
  )
  readImageFile(
    file2,
    async dataUrl => {
      if (!(await applyFile(file2, dataUrl, { onImageUpdate: onRightImageUpdate, onMetadataUpdate: onRightMetadataUpdate }))) return
      logger.info('Right image updated via drag and drop.')
    },
    () => logger.showError('Failed to read second dropped file: result is not a string.'),
  )
}

export function handleMultipleFilesUpload(files: FileList, callbacks: MultipleImagesUpdateCallbacks | TwoImagesUpdateCallbacks): void {
  if (files.length === requiredFilesCount && 'onLeftImageUpdate' in callbacks) loadTwoImages(files, callbacks)
  else if (files.length > requiredFilesCount && 'onContestStart' in callbacks) loadImagesForContest(files, callbacks)
  else if (files.length === 1) logger.showError('Please drop 2 or more images to compare.')
}

export function isDragLeavingContainer(event: React.DragEvent): boolean {
  return event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget as Node)
}
/* v8 ignore stop */

export function getContainedSize(params: { imageHeight: number; imageWidth: number; maxHeight: number; maxWidth: number }) {
  const { imageWidth, imageHeight, maxWidth, maxHeight } = params
  const aspectRatio = imageWidth / imageHeight
  const maxAspectRatio = maxWidth / maxHeight
  if (aspectRatio > maxAspectRatio) return { height: Math.round(maxWidth / aspectRatio), width: Math.round(maxWidth) }
  return { height: Math.round(maxHeight), width: Math.round(maxHeight * aspectRatio) }
}
