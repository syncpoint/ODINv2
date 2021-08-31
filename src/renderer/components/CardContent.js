import React from 'react'
import PropTypes from 'prop-types'

export const CardContent = props => {
  return (
    <div className='card-content'>{props.children}</div>
  )
}

CardContent.propTypes = {
  children: PropTypes.node.isRequired
}