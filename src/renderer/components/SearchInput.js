import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'antd'
import { cmdOrCtrl } from '../platform'

export const SearchInput = props => {
  const [value, setValue] = React.useState('')

  const handleChange = ({ target }) => {
    setValue(target.value)
    props.onSearch(target.value)
  }

  const handleKeyDown = event => {
    const { key } = event
    if (key === 'Home') event.preventDefault()
    else if (key === 'End') event.preventDefault()
    else if (key === 'Escape') {
      if (value === '') return
      setValue('')
      props.onSearch('')
    }

    // Prevent native select/all:
    if (cmdOrCtrl(event) && key === 'a') event.stopPropagation()
    else if (key === ' ') event.stopPropagation()
  }

  return (
    <Input
      autoFocus
      allowClear
      value={value}
      placeholder={props.placeholder}
      size={props.size || 'default'}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    >
    </Input>
  )
}

SearchInput.propTypes = {
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  size: PropTypes.string
}
