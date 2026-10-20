type ClassValue = boolean | string | undefined

/**
 * Join the truthy class names into a single class string
 * @param classes the class names, falsy values are ignored
 * @returns the joined class string
 */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ')
}
