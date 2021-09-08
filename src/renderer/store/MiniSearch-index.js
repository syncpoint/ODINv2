import * as R from 'ramda'
import MiniSearch from 'minisearch'

export const createIndex = () => new MiniSearch({
  fields: ['text', 'tags'],
  tokenize: (string, fieldName) => {
    const tokens = R.uniq([
      ...string.split(/[\s-/]/), // A: el clásico
      ...string.split(/(\/?["\w]+\.?)|[ /]/), // B: leading '/' and trailing '.'
      ...string.split(/([\d/.]+)/) // C: separate numbers and words
    ]
      .filter(Boolean)
      .map(s => s.trim())
      .filter(s => !s.includes(' ')) // filter tokens with blanks introduced by C
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


/**
 *
 */
export const searchIndex = (index, tokens) => {
  const options = field => ({ fields: [field], prefix: true, combineWith: 'AND' })
  const searchIndex = field => {
    const matches = index.search(tokens[field].join(' '), options(field))
    return matches.map(R.prop('id'))
  }

  const A = searchIndex('text')
  const B = searchIndex('tags')
  return A.length
    ? B.length
      ? R.intersection(A, B)
      : A
    : B
}
