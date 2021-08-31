import * as R from 'ramda'
import React from 'react'
import { initialState, multiselect, singleselect } from './list-state'


/**
 *
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => { setDebouncedValue(value) }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}


/**
 *
 */
export const useList = (options = {}) => {
  const strategy = options.multiselect ? multiselect : singleselect
  const reducer = (state, event) => {
    const handler = strategy[event.type]
    return handler ? handler(state, event) : state
  }

  return React.useReducer(reducer, initialState)
}


/**
 *
 */
export const useStack = initial => {
  const reducer = (entries, event) => {
    switch (event.type) {
      // might change entries unnecessarily (accepted for now)
      case 'reset': return [event.entry]
      case 'push': return [...entries, event.entry]
      case 'pop': return event.key
        ? R.dropLastWhile(entry => entry.key !== event.key, entries)
        : R.dropLast(1, entries)
    }
  }

  return React.useReducer(reducer, initial)
}
