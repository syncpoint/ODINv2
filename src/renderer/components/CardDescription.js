import React from 'react'
import PropTypes from 'prop-types'
import './CardDescription.css'

export const CardDescription = props => {
  return (
    <div>
      <span className='card-description'>{props.children}</span>
    </div>
  )
}

CardDescription.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}
