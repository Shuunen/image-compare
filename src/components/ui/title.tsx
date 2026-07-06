import type { JSX, ReactNode } from 'react'
import { cn } from 'shuutils'

const levelClasses = {
  1: 'text-2xl font-bold',
  2: 'text-xl',
} as const

type TitleProps = {
  children: ReactNode
  className?: string
  level?: keyof typeof levelClasses
}

export function Title({ children, className = '', level = 1 }: TitleProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return <Tag className={cn('font-semibold tracking-tight text-foreground', levelClasses[level], className)}>{children}</Tag>
}
