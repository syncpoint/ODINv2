import React from 'react'
import PropTypes from 'prop-types'
import { Map } from '../map/Map'

/**
 * <Map/> and <Project/> are siblings with <body/> as parent.
 */
export const Project = props => {
  return (
    <>
      <Map></Map>
    </>
  )
}

Project.propTypes = {
}
