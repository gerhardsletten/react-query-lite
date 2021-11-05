export const now = () => new Date().getTime()

export function shallowEqualObjects(a, b, debug) {
  if ((a && !b) || (b && !a)) {
    return false
  }
  for (const key in a) {
    if (
      a[key] !== b[key] &&
      (typeof a[key] !== 'object' || typeof b[key] !== 'object')
    ) {
      return false
    }
  }
  return true
}
