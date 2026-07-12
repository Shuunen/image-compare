import { type MouseEvent, type MouseEventHandler, type RefObject, useEffect, useRef, useState } from 'react'
// oxlint-disable max-lines-per-function, id-length
import { functionReturningVoid } from 'shuutils'
import { calculateNewPan, calculateNewZoom, type DragStartPosition, getCursorType, getImageStyle, headerAndControlsHeight, minHeight, minWidth, minZoom, type PanPosition, padding, shouldResetPan } from '../utils/comparison.utils'
import { getContainedSize, type ImageMetadata } from '../utils/image.utils'

type UsePanZoomReturn = {
  cursor: 'auto' | 'grab' | 'grabbing'
  handleMouseDownOnImage: MouseEventHandler<HTMLDivElement>
  handleMouseMove: (e: MouseEvent) => void
  handleMouseUpOrLeave: () => void
  imageStyle: {
    transform: string
    transition: string
  }
  isPanning: boolean
  pan: PanPosition
  setPan: (pan: PanPosition) => void
  setZoom: (zoom: number) => void
  zoom: number
}

export function usePanZoom(imageContainerRef: RefObject<HTMLDivElement | null>, leftImageMetadata: ImageMetadata | undefined, rightImageMetadata: ImageMetadata | undefined): UsePanZoomReturn {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const dragStartRef = useRef<DragStartPosition>({ panX: 0, panY: 0, x: 0, y: 0 })
  const zoomRef = useRef(zoom)
  const metadataRef = useRef({ leftImageMetadata, rightImageMetadata })

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    metadataRef.current = { leftImageMetadata, rightImageMetadata }
  }, [leftImageMetadata, rightImageMetadata])

  const changeZoom = (newZoom: number) => {
    setZoom(newZoom)
    if (shouldResetPan(newZoom)) setPan({ x: 0, y: 0 })
  }

  useEffect(() => {
    const container = imageContainerRef.current
    if (!container) return functionReturningVoid
    const handleWheelEvent = (e: globalThis.WheelEvent) => {
      e.preventDefault()
      const { leftImageMetadata: left, rightImageMetadata: right } = metadataRef.current
      const metadata = left || right
      const currentZoom = zoomRef.current
      if (!metadata?.width || !metadata?.height) {
        changeZoom(calculateNewZoom(currentZoom, e.deltaY))
        return
      }
      const maxWidth = window.innerWidth - padding
      const maxHeight = window.innerHeight - headerAndControlsHeight
      const containedSize = getContainedSize({
        imageHeight: metadata.height,
        imageWidth: metadata.width,
        maxHeight,
        maxWidth,
      })
      const newZoom = calculateNewZoom(currentZoom, e.deltaY)
      const wouldBeWidth = containedSize.width * newZoom
      const wouldBeHeight = containedSize.height * newZoom
      if (wouldBeWidth >= minWidth || wouldBeHeight >= minHeight) changeZoom(newZoom)
    }
    container.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelEvent)
  }, [imageContainerRef])

  const handleMouseDownOnImage: MouseEventHandler<HTMLDivElement> = e => {
    if (zoom <= minZoom) return
    e.preventDefault()
    dragStartRef.current = {
      panX: pan.x,
      panY: pan.y,
      x: e.clientX,
      y: e.clientY,
    }
    setIsPanning(true)
  }

  const handleMouseUpOrLeave = () => {
    setIsPanning(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning && zoom > minZoom) setPan(calculateNewPan(dragStartRef.current, e.clientX, e.clientY))
  }

  const imageStyle = getImageStyle(pan, zoom, isPanning)

  const cursor = getCursorType(false, zoom, isPanning)

  return {
    cursor,
    handleMouseDownOnImage,
    handleMouseMove,
    handleMouseUpOrLeave,
    imageStyle,
    isPanning,
    pan,
    setPan,
    setZoom: changeZoom,
    zoom,
  }
}
