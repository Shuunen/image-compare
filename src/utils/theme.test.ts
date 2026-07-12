import { functionReturningVoid } from 'shuutils'
import { logger } from './logger.utils'
import { setDarkTheme } from './theme.utils'

const infoSpy = vi.spyOn(logger, 'info').mockImplementation(functionReturningVoid)

describe('theme.utils', () => {
  it('setDarkTheme A should enable dark theme when isDark is true', () => {
    document.documentElement.classList.remove('dark')
    setDarkTheme(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setDarkTheme B should disable dark theme when isDark is false', () => {
    document.documentElement.classList.add('dark')
    setDarkTheme(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setDarkTheme C should log enabling message when isDark is true', () => {
    infoSpy.mockClear()
    setDarkTheme(true)
    expect(infoSpy).toHaveBeenCalledWith('Enabling dark theme')
  })

  it('setDarkTheme D should log disabling message when isDark is false', () => {
    infoSpy.mockClear()
    setDarkTheme(false)
    expect(infoSpy).toHaveBeenCalledWith('Disabling dark theme')
  })
})
