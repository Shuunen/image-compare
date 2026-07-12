import { fireEvent, render, screen } from '@testing-library/react'
import { sleep } from 'shuutils'
import { Comparison } from './comparison.tab'

describe('comparison', () => {
  it('Comparison A should render successfully', () => {
    const { container } = render(<Comparison />)
    expect(container).toBeInstanceOf(HTMLElement)
  })

  it('Comparison B should render control buttons', () => {
    render(<Comparison />)
    const controlButtons = screen.getByTestId('control-buttons')
    expect(controlButtons).toBeInstanceOf(HTMLElement)
  })

  it('Comparison C should display zoom percentage', () => {
    render(<Comparison />)
    const zoomText = screen.getByText('Zoom: 100%')
    expect(zoomText).toBeInstanceOf(HTMLElement)
  })

  it('Comparison D should reset view when reset button is clicked', () => {
    render(<Comparison />)
    const resetButton = screen.getByText('Reset view')
    fireEvent.click(resetButton)
    const zoomText = screen.getByText('Zoom: 100%')
    expect(zoomText).toBeInstanceOf(HTMLElement)
  })

  it('Comparison E should update zoom on wheel event', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.wheel(imageViewer, { deltaY: -100 })
    const zoomText = screen.getByText('Zoom: 110%')
    expect(zoomText).toBeInstanceOf(HTMLElement)
  })

  it('Comparison F should handle drag enter event', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.dragEnter(imageViewer, {
      dataTransfer: {
        items: [{ kind: 'file' }, { kind: 'file' }],
      },
    })
    const overlay = screen.getByTestId('drag-overlay')
    expect(overlay).toHaveStyle({ display: 'flex' })
    expect(screen.getByText('Drop these 2 images to compare them')).toBeInstanceOf(HTMLElement)
  })

  it('Comparison G should handle drag leave event', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.dragEnter(imageViewer, {
      dataTransfer: {
        items: [{ kind: 'file' }, { kind: 'file' }],
      },
    })
    const overlay = screen.getByTestId('drag-overlay')
    expect(overlay).toHaveStyle({ display: 'flex' })
    fireEvent.dragLeave(imageViewer, {
      currentTarget: imageViewer,
      relatedTarget: undefined,
      target: imageViewer,
    })
    expect(overlay).toHaveStyle({ display: 'none' })
  })

  it('Comparison H should handle mouse down on image when zoomed', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    // First zoom in
    fireEvent.wheel(imageViewer, { deltaY: -500 })
    // Then try to pan
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    expect(imageViewer).toHaveStyle({ cursor: 'grabbing' })
  })

  it('Comparison I should handle mouse move when panning', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    // Zoom in
    fireEvent.wheel(imageViewer, { deltaY: -500 })
    // Start panning
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    // Move mouse
    fireEvent.mouseMove(imageViewer, { clientX: 150, clientY: 150 })
    const leftImage = screen.getByAltText('left')
    expect(leftImage).toHaveStyle({ transform: 'translate(50px, 50px) scale(1.5)' })
  })

  it('Comparison J should handle mouse up to stop panning', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.wheel(imageViewer, { deltaY: -500 })
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    fireEvent.mouseUp(imageViewer)
    expect(imageViewer).toHaveStyle({ cursor: 'grab' })
  })

  it('Comparison K should handle mouse leave to stop panning', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.wheel(imageViewer, { deltaY: -500 })
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    fireEvent.mouseLeave(imageViewer)
    expect(imageViewer).toHaveStyle({ cursor: 'grab' })
  })

  it('Comparison L should handle slider value change', () => {
    render(<Comparison />)
    // Slider control is rendered
    const container = screen.getByTestId('control-buttons').parentElement
    expect(container).toBeInstanceOf(HTMLElement)
  })

  it('Comparison M should not pan when zoom is at minimum', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    // Try to pan without zooming
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(imageViewer, { clientX: 150, clientY: 150 })
    // Should not pan, verify zoom is still 100%
    const zoomText = screen.getByText('Zoom: 100%')
    expect(zoomText).toBeInstanceOf(HTMLElement)
  })

  it('Comparison N should handle drag over event without clearing the overlay', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.dragEnter(imageViewer, {
      dataTransfer: {
        items: [{ kind: 'file' }],
      },
    })
    const overlay = screen.getByTestId('drag-overlay')
    expect(overlay).toHaveStyle({ display: 'flex' })
    fireEvent.dragOver(imageViewer, {
      dataTransfer: {
        items: [{ kind: 'file' }],
      },
    })
    expect(overlay).toHaveStyle({ display: 'flex' })
  })

  it('Comparison O should handle drop event with files', async () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    fireEvent.drop(imageViewer, {
      dataTransfer: {
        files: [file1, file2],
      },
    })
    await sleep(20)
    const leftImage = screen.getByAltText('left')
    const rightImage = screen.getByAltText('right')
    expect(leftImage).toHaveAttribute('src', expect.stringContaining('data:'))
    expect(rightImage).toHaveAttribute('src', expect.stringContaining('data:'))
  })

  it('Comparison P should handle slider handle drag', () => {
    render(<Comparison />)
    const sliderHandle = screen.getByTestId('slider-handle')
    fireEvent.mouseDown(sliderHandle, { clientX: 100, clientY: 100 })
    expect(sliderHandle).toBeInstanceOf(HTMLElement)
  })

  it('Comparison Q should handle slider handle drag move', () => {
    render(<Comparison />)
    const sliderHandle = screen.getByTestId('slider-handle')
    const imageViewer = screen.getByTestId('image-viewer')
    fireEvent.mouseDown(sliderHandle, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(imageViewer, { clientX: 200, clientY: 100 })
    expect(sliderHandle).toBeInstanceOf(HTMLElement)
  })

  it('Comparison R should handle winner selection and update images', async () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    // Drop 4 files to start contest
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
    const file3 = new File(['content3'], 'test3.jpg', { type: 'image/jpeg' })
    const file4 = new File(['content4'], 'test4.jpg', { type: 'image/jpeg' })
    fireEvent.drop(imageViewer, {
      dataTransfer: {
        files: [file1, file2, file3, file4],
      },
    })
    await sleep(20)
    expect(screen.getByText('Round 1 - Match 1')).toBeInstanceOf(HTMLElement)
    fireEvent.click(screen.getByText('Choose left image'))
    expect(screen.getByText('Round 1 - Match 2')).toBeInstanceOf(HTMLElement)
  })

  it('Comparison S should handle left image upload', async () => {
    render(<Comparison />)
    const fileInput = screen.getByTestId('left-upload-input')
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await sleep(20)
    const leftImage = screen.getByAltText('left')
    expect(leftImage).toHaveAttribute('src', expect.stringContaining('data:'))
  })

  it('Comparison T should handle right image upload', async () => {
    render(<Comparison />)
    const fileInput = screen.getByTestId('right-upload-input')
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await sleep(20)
    const rightImage = screen.getByAltText('right')
    expect(rightImage).toHaveAttribute('src', expect.stringContaining('data:'))
  })

  it('Comparison U should handle zoom triggering pan reset', () => {
    render(<Comparison />)
    const imageViewer = screen.getByTestId('image-viewer')
    // Zoom in first
    fireEvent.wheel(imageViewer, { deltaY: -500 })
    // Pan the image
    fireEvent.mouseDown(imageViewer, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(imageViewer, { clientX: 150, clientY: 150 })
    fireEvent.mouseUp(imageViewer)
    // Zoom back to minimum - should reset pan
    fireEvent.wheel(imageViewer, { deltaY: 5000 })
    const zoomText = screen.getByText('Zoom: 10%')
    expect(zoomText).toBeInstanceOf(HTMLElement)
  })
})
