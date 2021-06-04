import React from 'react'
import PropTypes from 'prop-types'

export const ProjectTitleInput = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)
  const handleBlur = () => props.onChange(value)

  return <input
    className='cardtitle'
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
  />
}

ProjectTitleInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}
