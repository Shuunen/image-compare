import { useCallback, useEffect, useRef, useState } from 'react'
import { type ContestState, selectWinner } from '../utils/comparison.utils'
import { fetchImageMetadata, type ImageMetadata } from '../utils/image.utils'

type UseContestModeReturn = {
  contestState: ContestState | undefined
  handleSelectWinner: (winnerId: number) => void
  setContestState: (state: ContestState | undefined) => void
}

type UseContestModeCallbacks = {
  onLeftImageUpdate: (image: string) => void
  onLeftMetadataUpdate: (metadata: ImageMetadata) => void
  onRightImageUpdate: (image: string) => void
  onRightMetadataUpdate: (metadata: ImageMetadata) => void
}

export function useContestMode(callbacks: UseContestModeCallbacks): UseContestModeReturn {
  const [contestState, setContestState] = useState<ContestState | undefined>(undefined)
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    const updateSideMetadata = (url: string, filename: string, onMetadataUpdate: (metadata: ImageMetadata) => void) => {
      // oxlint-disable-next-line promise/prefer-await-to-then
      void fetchImageMetadata(url).then(metadata => {
        onMetadataUpdate({ ...metadata, filename: filename || metadata.filename })
        return undefined
      })
    }
    if (contestState?.currentMatch) {
      const { leftImage, rightImage } = contestState.currentMatch
      callbacksRef.current.onLeftImageUpdate(leftImage.url)
      callbacksRef.current.onRightImageUpdate(rightImage.url)
      updateSideMetadata(leftImage.url, leftImage.filename, callbacksRef.current.onLeftMetadataUpdate)
      updateSideMetadata(rightImage.url, rightImage.filename, callbacksRef.current.onRightMetadataUpdate)
    }
  }, [contestState])

  const handleSelectWinner = useCallback(
    (winnerId: number) => {
      if (!contestState) return
      const newState = selectWinner(contestState, winnerId)
      setContestState(newState)
    },
    [contestState],
  )

  return {
    contestState,
    handleSelectWinner,
    setContestState,
  }
}
