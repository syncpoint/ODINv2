import * as R from 'ramda'
import MiniSearch from 'minisearch'

export const createIndex = () => new MiniSearch({
  fields: ['text', 'tags'],
  tokenize: (string, fieldName) => {
    const tokens = R.uniq([
      ...string.split(/[\s-/]/), // A: el clásico
      ...string.split(/([/]?["\w]+[.]?)|[ /]/), // B: leading '/' and trailing '.'
      ...string.split(/([\d/]+)/), // C: trailing '/'
      ...string.split(/([\d ]+)/) // D: separate numbers and words
    ]
      .map(s => s ? s.trim() : '')
      .filter(s => !s.includes(' ')) // filter tokens with blanks introduced by C
      .filter(Boolean)
    )

    return tokens
  },

  extractField: (document, fieldName) => {
    const value = document[fieldName]
    return value && fieldName === 'tags'
      ? value.flat().filter(R.identity).join(' ')
      : value
  }
})

/**
 *
 */
export const parseQuery = query => {
  const tokens = (query || '').split(' ')
  return tokens.reduce((acc, token) => {
    if (token.startsWith('@') && token.length > 1) acc.scope.push(token.substring(1))
    else if (token.startsWith('#') && token.length > 1) acc.tags.push(token.substring(1))
    else if (token) acc.text.push(token)
    return acc
  }, { scope: [], text: [], tags: [] })
}

const searchField = (index, field, tokens) => {

  // No search result is different from empty search result.
  if (!tokens.length) return null

  const options = field => ({ fields: [field], prefix: true, combineWith: 'AND' })
  const matches = index.search(tokens.join(' '), options(field))
  return matches.map(R.prop('id'))
}

/**
 *
 */
export const searchIndex = (index, tokens) => {
  const A = searchField(index, 'text', tokens.text)
  const B = searchField(index, 'tags', tokens.tags)
  return A ? B ? R.intersection(A, B) : A : B
}
