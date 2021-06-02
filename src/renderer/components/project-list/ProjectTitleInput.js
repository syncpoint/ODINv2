import React from 'react'
import PropTypes from 'prop-types'

// TODO: support 'Escape' key to revert edit and focus parent
export const ProjectTitleInput = props => {
  const { editing } = props
  const [value, setValue] = React.useState(props.value)

  const handleChange = event => {
    setValue(event.target.value)
  }

  const handleBlur = () => {
    if (editing) props.onChange(value)
  }

  return <input
    className='cardtitle'
    type={editing ? 'search' : 'submit'}
    disabled={!editing} /* prevent focus when not editable */
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
  />
}

ProjectTitleInput.propTypes = {
  value: PropTypes.string.isRequired,
  editing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
}
