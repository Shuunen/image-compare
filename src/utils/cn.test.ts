import { cn } from './cn.utils'

describe('cn.utils', () => {
  describe(cn, () => {
    it('cn A should join class names with a space', () => {
      expect(cn('a', 'b')).toBe('a b')
    })

    it('cn B should ignore falsy values', () => {
      expect(cn('a', false, undefined, '', 'b')).toBe('a b')
    })

    it('cn C should return an empty string without classes', () => {
      expect(cn()).toBe('')
    })
  })
})
