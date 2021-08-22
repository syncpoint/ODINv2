import React from 'react'
import PropTypes from 'prop-types'

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
