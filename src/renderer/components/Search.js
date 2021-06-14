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
    const { key } = event
    if (key === 'ArrowUp') event.preventDefault()
    if (key === 'ArrowDown') event.preventDefault()
    if (key === 'ArrowDown') props.onFocusList()

    if (key === 'Escape') {
      if (value === '') return
      setValue('')
      props.onSearch('')
    }
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
  onSearch: PropTypes.func.isRequired,
  onFocusList: PropTypes.func.isRequired
}
