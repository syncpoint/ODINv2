
/**
 *
 */
export function memoize (method) {
  const cache = {}
  return function () {
    const args = JSON.stringify(arguments)
    cache[args] = cache[args] || method.apply(this, arguments)
    return cache[args]
  }
}


/**
 *
 */
export const parseQuery = query => {
  const tokens = (query || '').split(' ')
  return tokens.reduce((acc, token) => {
    if (token.startsWith('@')) acc.scope = token.substring(1)
    else if (token.startsWith('#')) acc.tags.push(token.substring(1))
    else if (token) acc.text.push(token)
    return acc
  }, { text: [], tags: [] })
}
