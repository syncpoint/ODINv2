import React from 'react'
import PropTypes from 'prop-types'
import './CardContent.css'

export const CardContent = props => {
  return (
    <div className='card-content'>
      { props.children }
    </div>
  )
}

CardContent.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}
