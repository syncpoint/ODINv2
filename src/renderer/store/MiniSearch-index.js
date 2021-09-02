import * as R from 'ramda'
import MiniSearch from 'minisearch'

export const createIndex = () => new MiniSearch({
  fields: ['text', 'tags'],
  tokenize: string => {
    const tokens = R.uniq([
      ...string.split(/[\s-/]/), // el clásico
      ...string.split(/(\/?["\w]+\.?)|[ /]/), // leading '/' and trailing '.'
      ...string.split(/([\d/.]+)/) // separate numbers and words
    ].filter(Boolean).map(s => s.trim()))
    return tokens
  },
  extractField: (document, fieldName) => {
    const value = document[fieldName]
    return value && fieldName === 'tags'
      ? value.flat().filter(R.identity).join(' ')
      : value
  }
})
