import { useSyncExternalStore } from 'react'

export type MediaMode = 'image' | 'video'

const listeners = new Set<() => void>()
let currentMode: MediaMode = 'image'

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getMode() {
  return currentMode
}

/**
 * Switch the whole app wording and accent color between image and video
 * @param mode the new mode
 */
export function setMediaMode(mode: MediaMode) {
  if (mode === currentMode) return
  currentMode = mode
  globalThis.document.documentElement.dataset.mode = mode
  globalThis.document.title = mode === 'video' ? 'Video Compare' : 'Image Compare'
  for (const listener of listeners) listener()
}

export function useMediaMode(): MediaMode {
  return useSyncExternalStore(subscribe, getMode, getMode)
}
