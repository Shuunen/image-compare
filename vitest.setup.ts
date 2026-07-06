// Mock fetch to prevent network calls during tests
vi.spyOn(globalThis, 'fetch').mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['mock-image-data'], { type: 'image/png' })),
  json: () => Promise.resolve({}),
  ok: true,
  status: 200,
  text: () => Promise.resolve(''),
} as Response)

// Mock Image loading to prevent actual image loads
// oxlint-disable-next-line typescript/no-deprecated
const originalCreateElement = globalThis.document.createElement.bind(globalThis.document)
const dispatchLoadEvent = (image: HTMLImageElement): void => {
  const loadEvent = new Event('load')
  image.dispatchEvent(loadEvent)
}
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tagName: string): HTMLElement => {
  if (tagName === 'img') {
    const img = originalCreateElement(tagName)
    // Immediately trigger load event when src is set. The real "src" attribute is intentionally
    // never touched: setting it triggers happy-dom's own async image resource loading, which races
    // this synthetic load event and can overwrite naturalWidth/naturalHeight with real (zero) values.
    let src = ''
    Object.defineProperty(img, 'src', {
      get() {
        return src
      },
      set(value: string) {
        src = value
        // Set natural dimensions
        Object.defineProperty(img, 'naturalWidth', { value: 1920, writable: true })
        Object.defineProperty(img, 'naturalHeight', { value: 1080, writable: true })
        // Trigger load event immediately, before happy-dom's own async image loading can race it
        dispatchLoadEvent(img)
      },
    })
    return img
  }
  return originalCreateElement(tagName)
})
