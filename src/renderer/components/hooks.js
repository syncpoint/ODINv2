import React from 'react'
import PropTypes from 'prop-types'
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
export const useMemento = (key, defaultValue) => {
  const { preferencesStore } = useServices()
  const [value, setValue] = React.useState(null)

  const put = React.useCallback(newValue => {
    preferencesStore.put(key, newValue)
  }, [preferencesStore, key])

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    (async () => setValue(await preferencesStore.get(key, defaultValue)))()
    const handler = ({ value }) => setValue(value)
    preferencesStore.on(key, handler)
    return () => preferencesStore.off(key, handler)
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return [value, put]
}
