import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchImageMetadata, type ImageMetadata } from '../utils/image.utils'

type UseImageStateReturn = {
  leftImage: string
  leftImageMetadata: ImageMetadata | undefined
  rightImage: string
  rightImageMetadata: ImageMetadata | undefined
  setLeftImage: (image: string) => void
  setLeftImageMetadata: (metadata: ImageMetadata | undefined) => void
  setRightImage: (image: string) => void
  setRightImageMetadata: (metadata: ImageMetadata | undefined) => void
}

const defaultImages = {
  after: '/sample-image-green.svg',
  before: '/sample-image-blue.svg',
}

// videos and extracted frames are object urls, they hold memory until revoked
function useReleasingImage(initial: string): [string, (image: string) => void] {
  const [image, setImage] = useState(initial)
  const imageRef = useRef(initial)
  const replaceImage = useCallback((next: string) => {
    if (imageRef.current !== next && imageRef.current.startsWith('blob:')) globalThis.URL.revokeObjectURL(imageRef.current)
    imageRef.current = next
    setImage(next)
  }, [])
  return [image, replaceImage]
}

export function useImageState(): UseImageStateReturn {
  const [leftImage, setLeftImage] = useReleasingImage(defaultImages.before)
  const [rightImage, setRightImage] = useReleasingImage(defaultImages.after)
  const [leftImageMetadata, setLeftImageMetadata] = useState<ImageMetadata | undefined>(undefined)
  const [rightImageMetadata, setRightImageMetadata] = useState<ImageMetadata | undefined>(undefined)

  useEffect(() => {
    const loadDefaultMetadata = async () => {
      const [leftMeta, rightMeta] = await Promise.all([fetchImageMetadata(defaultImages.before), fetchImageMetadata(defaultImages.after)])
      setLeftImageMetadata(leftMeta)
      setRightImageMetadata(rightMeta)
    }
    void loadDefaultMetadata()
  }, [])

  return {
    leftImage,
    leftImageMetadata,
    rightImage,
    rightImageMetadata,
    setLeftImage,
    setLeftImageMetadata,
    setRightImage,
    setRightImageMetadata,
  }
}
