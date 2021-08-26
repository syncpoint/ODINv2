import React from 'react'
import PropTypes from 'prop-types'

/**
 *
 */
export const CardTitle = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)

  const handleBlur = () => {
    if (props.value === value) return
    props.onChange(value.trim())
  }

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => event.stopPropagation()
  const placeholder = value ? null : 'N/A (click to edit)'

  return <input
    className='card-title'
    value={value || ''}
    placeholder={placeholder}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />
}

CardTitle.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
}
