import * as R from 'ramda'
import MiniSearch from 'minisearch'

export const createIndex = () => new MiniSearch({
  fields: ['text', 'tags', 'scope'],
  tokenize: string => {
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
    if (fieldName === 'tags') {
      return value ? value.flat().filter(R.identity).join(' ') : value
    }
    if (fieldName === 'scope') {
      // Remove hyphens to prevent tokenizer from splitting scope values
      // e.g., 'sse-service' becomes 'sseservice' to avoid matching 'tile-service'
      return value ? value.replace(/-/g, '') : value
    }
    return value
  }
})


export const parseQuery = (terms, ids = []) => {
  const tokens = (terms || '').split(' ')
  const parts = tokens.reduce((acc, token) => {
    if (token.startsWith('@')) {
      // Remove hyphens to match the extractField transformation for scope
      const scopeValue = token.substring(1).replace(/-/g, '')
      scopeValue.length > 1 && acc.scope.push(scopeValue)
    } else if (token.startsWith('#')) token.length > 2 && acc.tags.push(token.substring(1))
    else if (token.startsWith('!')) token.length > 2 && acc.ids.push(token.substring(1))
    else if (token.startsWith('&')) { /* ignore */ } else if (token) acc.text.push(token)
    return acc
  }, { scope: [], text: [], tags: [], ids })

  const query = { combineWith: 'AND', queries: [] }

  const add = (field, combineWith, prefix) => {
    const queries = parts[field]
    if (!queries || !queries.length) return
    query.queries.push({ fields: [field], combineWith, queries, prefix })
  }

  add('scope', 'OR')
  add('text', 'AND', true)
  add('tags', 'AND', true)

  const filter = parts.ids && parts.ids.length
    ? result => parts.ids.some(id => result.id.startsWith(id))
    : null

  return filter
    ? [query, { filter }]
    : [query]
}
