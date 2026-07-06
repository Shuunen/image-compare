import type { ReactNode } from 'react'
import { cn } from 'shuutils'

type ParagraphProps = {
  children: ReactNode
  className?: string
}

export function Paragraph({ children, className = '' }: ParagraphProps) {
  return <p className={cn('leading-relaxed text-foreground', className)}>{children}</p>
}
