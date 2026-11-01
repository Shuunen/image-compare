import { act, renderHook } from '@testing-library/react'
import { useImageState } from './use-image-state'

vi.mock(import('../utils/image.utils'), async importOriginal => ({
  ...(await importOriginal()),
  fetchImageMetadata: vi.fn<() => Promise<{ filename: string; height: number; size: number; width: number }>>().mockResolvedValue({ filename: 'x', height: 1, size: 1, width: 1 }),
}))

describe('use-image-state', () => {
  // Value: protects=a replaced video or frame object url is released; fails_when=the old blob url is never revoked so memory grows with every swap; why_new=hooks have no tests and nothing released object urls; seam=none; no_claim=real memory usage (revokeObjectURL is spied)
  it('useImageState A should revoke the previous object url but never the current one or a regular url', async () => {
    const revoke = vi.spyOn(globalThis.URL, 'revokeObjectURL').mockReturnValue(undefined)
    const { result } = renderHook(() => useImageState())
    await act(async () => {
      await Promise.resolve()
    })
    act(() => result.current.setLeftImage('blob:first'))
    expect(revoke).not.toHaveBeenCalled()
    act(() => result.current.setLeftImage('blob:first'))
    expect(revoke).not.toHaveBeenCalled()
    act(() => result.current.setLeftImage('blob:second'))
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:first')
    expect(result.current.leftImage).toBe('blob:second')
    act(() => result.current.setRightImage('data:image/png;base64,abc'))
    expect(revoke).toHaveBeenCalledOnce()
  })
})
