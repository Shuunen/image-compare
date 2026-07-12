import { render, screen } from '@testing-library/react'
import { ImageInfos } from './image-infos'

describe('image-infos', () => {
  it('ImageInfos A empty infos means no paragraphs are rendered', () => {
    const { container } = render(<ImageInfos infos={[]} />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('ImageInfos B should render left column infos for provided metadata', () => {
    const leftImageMetadata = { filename: 'left.jpg', height: 600, size: 2048, width: 800 }
    const rightImageMetadata = { filename: 'right.png', height: 1768, size: 4_239_680, width: 4024 }
    render(<ImageInfos infos={[leftImageMetadata, rightImageMetadata]} />)
    const leftName = screen.getByText('left.jpg')
    expect(leftName).toBeInstanceOf(HTMLElement)
    const leftSize = screen.getByText('2.00 KB')
    expect(leftSize).toBeInstanceOf(HTMLElement)
    const leftResolution = screen.getByText('800 × 600')
    expect(leftResolution).toBeInstanceOf(HTMLElement)
  })

  it('ImageInfos C should render right column infos for provided metadata', () => {
    const leftImageMetadata = { filename: 'left.jpg', height: 600, size: 2048, width: 800 }
    const rightImageMetadata = { filename: 'right.png', height: 1768, size: 4_239_680, width: 4024 }
    render(<ImageInfos infos={[leftImageMetadata, rightImageMetadata]} />)
    const rightName = screen.getByText('right.png')
    expect(rightName).toBeInstanceOf(HTMLElement)
    const rightSize = screen.getByText('4.04 MB')
    expect(rightSize).toBeInstanceOf(HTMLElement)
    const rightResolution = screen.getByText('4024 × 1768')
    expect(rightResolution).toBeInstanceOf(HTMLElement)
  })
})
