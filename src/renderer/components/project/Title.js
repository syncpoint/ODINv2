import React from 'react'
import PropTypes from 'prop-types'

export const Title = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)
  const handleBlur = () => props.onChange(value)

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => event.stopPropagation()

  return <input
    className='cardtitle'
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />
}

Title.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}
