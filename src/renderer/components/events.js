export const stopPropagation = event => event.stopPropagation()
export const preventDefault = event => event.preventDefault()

export const matcher = (predicates, fn) => event => {
  if (predicates.some(p => p(event))) fn(event)
  return event
}
