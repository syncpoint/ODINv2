import React from 'react'
import PropTypes from 'prop-types'

export const CardDescription = props => {
  const text = props.value &&
    <span className='card-description'>{props.value}</span>
  return <div>{text}</div>
}

CardDescription.propTypes = {
  value: PropTypes.string
}
