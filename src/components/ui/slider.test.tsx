import { fireEvent, render, screen } from '@testing-library/react'
import { Slider } from './slider'

describe('slider', () => {
  it('Slider A should display the first value', () => {
    render(<Slider onValueChange={vi.fn<() => void>()} testId="slider" value={[42]} />)
    expect(screen.getByTestId('slider')).toHaveValue('42')
  })

  it('Slider B should fall back to zero without value', () => {
    render(<Slider onValueChange={vi.fn<() => void>()} testId="slider" value={[]} />)
    expect(screen.getByTestId('slider')).toHaveValue('0')
  })

  it('Slider C should emit the new value', () => {
    const onValueChange = vi.fn<(value: number[]) => void>()
    render(<Slider onValueChange={onValueChange} testId="slider" value={[10]} />)
    fireEvent.change(screen.getByTestId('slider'), { target: { value: '30' } })
    expect(onValueChange).toHaveBeenCalledWith([30])
  })
})
