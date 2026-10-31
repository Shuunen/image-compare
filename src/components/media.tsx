import type { RefCallback } from 'react'
import type { ImageStyle } from '../utils/comparison.utils'

type MediaProps = {
  alt: string
  imageStyle: ImageStyle
  isVideo: boolean
  src: string
  videoRef: RefCallback<HTMLVideoElement>
}

export function Media({ alt, imageStyle, isVideo, src, videoRef }: MediaProps) {
  if (isVideo) return <video className="size-full object-contain" data-testid={`${alt}-video`} loop muted playsInline ref={videoRef} src={src} style={imageStyle} />
  return <img alt={alt} className="size-full object-contain" src={src} style={imageStyle} />
}
