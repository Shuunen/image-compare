import { LoaderCircle } from 'lucide-react'
import type { CSSProperties } from 'react'

type FrameLoaderProps = {
  side: 'left' | 'right'
  style: CSSProperties
}

// covers the part of the viewer showing the side being processed
export function FrameLoader({ side, style }: FrameLoaderProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/60 text-sm text-foreground" data-testid={`${side}-frame-loader`} style={style}>
      <LoaderCircle className="size-8 animate-spin" />
      Extracting frame...
    </div>
  )
}
