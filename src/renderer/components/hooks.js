import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import isEqual from 'react-fast-compare'
import { initialState, multiselect, singleselect } from './list-state'


/**
 * Context holding (global) services.
 */
const ServiceContext = React.createContext({})


/**
 * Wrap children with provider and thus grant access to services.
 */
export const ServiceProvider = props => {
  const value = { ...props }
  delete value.children // don't propagate `children` property as service

  return (
    <ServiceContext.Provider value={value}>
      {props.children}
    </ServiceContext.Provider>
  )
}

ServiceProvider.propTypes = {
  children: PropTypes.node.isRequired
}


/**
* Client hook providing services held in context.
*/
export const useServices = () => React.useContext(ServiceContext)


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
      case 'reset': return isEqual(entries, [event.entry])
        ? entries
        : [event.entry]
      case 'push': return [...entries, event.entry]
      case 'pop': return event.key
        ? R.dropLastWhile(entry => entry.key !== event.key, entries)
        : R.dropLast(1, entries)
    }
  }

  return React.useReducer(reducer, initial)
}

export const useMemento = (key, defaultValue) => {
  const { preferencesStore: store } = useServices()
  const [value, setValue] = React.useState(null)

  const put = React.useCallback(newValue => {
    if (isEqual(value, newValue)) return
    store.put(key, newValue)
  }, [store, value, key])

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    (async () => setValue(await store.get(key, defaultValue)))()
    const handler = ({ value }) => setValue(value)
    store.on(key, handler)
    return () => store.off(key, handler)
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return [value, put]
}
