import React from 'react'
import PropTypes from 'prop-types'
import './TagList.css'

export const TagList = props => {
  return (
    <div className='taglist'>
      { props.children }
    </div>
  )
}

TagList.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}
