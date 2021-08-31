import * as R from 'ramda'
import React from 'react'
import { initialState, multiselect, singleselect } from './list-state'

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => { setDebouncedValue(value) }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export const useList = (options = {}) => {
  const strategy = options.multiselect ? multiselect : singleselect
  const reducer = (state, event) => {
    const handler = strategy[event.type]
    return handler ? handler(state, event) : state
  }

  return React.useReducer(reducer, initialState)
}

export const useStack = initial => {
  const [entries, setEntries] = React.useState(initial)

  return {
    entries,
    push: entry => setEntries([...entries, entry]),
    pop: (key) => {
      if (!key) setEntries(R.dropLast(1, entries))
      else setEntries(R.dropLastWhile(entry => entry.key !== key), entries)
    },
    reset: entry => setEntries([entry]),
    peek: () => R.last(entries)
  }
}
