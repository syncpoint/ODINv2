import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'antd'

export const Search = props => {
  const [value, setValue] = React.useState('')

  const handleChange = ({ target }) => {
    setValue(target.value)
    props.onSearch(target.value)
  }

  const handleKeyDown = event => {
    const { key, metaKey } = event
    if (key === 'Home') event.preventDefault()
    else if (key === 'End') event.preventDefault()
    else if (key === 'Escape') {
      if (value === '') return
      setValue('')
      props.onSearch('')
    }

    // Prevent native select/all:
    if (metaKey && key === 'a') event.stopPropagation()
  }

  return (
    <Input
      autoFocus
      allowClear
      value={value}
      placeholder="Search project"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    >
    </Input>
  )
}

Search.propTypes = {
  onSearch: PropTypes.func.isRequired
}
