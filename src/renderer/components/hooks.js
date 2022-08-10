import React from 'react'
import PropTypes from 'prop-types'
import { multiselect } from '../model/selection/multiselect'
import { singleselect } from '../model/selection/singleselect'
import Emitter from '../../shared/emitter'


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
  const initialState = {
    entries: [], // :: [{ id, ...any }]
    selected: [], // :: [id]
    focusIndex: -1, // :: number
    scroll: 'auto' // :: 'none' | 'smooth' | 'auto'
  }

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
  const [value, setValue] = React.useState(defaultValue)

  const put = React.useCallback(async value => {
    await preferencesStore.put(key, value)
  }, [preferencesStore, key])

  React.useEffect(() => {
    (async () => {
      const value = await preferencesStore.get(key, defaultValue)
      setValue(value)
    })()

    const handleUpdates = ({ value }) => setValue(value)
    preferencesStore.on(key, handleUpdates)
    return () => preferencesStore.off(key, handleUpdates)
  }, [preferencesStore, key, defaultValue])

  return [value, put]
}


/**
 *
 */
export const useEmitter = key => {
  const services = useServices()
  return React.useMemo(() => {
    services.emitters = services.emitters || {}
    services.emitters[key] = services.emitters[key] || new Emitter()
    return services.emitters[key]
  }, [key, services])
}
