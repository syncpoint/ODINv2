/* eslint-disable react/prop-types */
import React from 'react'
import { matcher, stopPropagation } from './events'
import { cmdOrCtrl } from '../platform'


/**
 *
 */
export const Title = props => {
  const [value, setValue] = React.useState(props.value)
  const inputRef = React.useRef()
  const placeholder = value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'


  React.useEffect(() => { setValue(props.value) }, [props.value])

  const rename = name => {
    if (props.value === name) return
    props.onTitleChange(props.editing, name.trim())
  }

  const reset = () => setValue(props.value)
  const handleChange = ({ target }) => setValue(target.value)

  const handleBlur = () => {
    if (!value) return
    rename(value)
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === ' ',
      event => event.key === 'a' && cmdOrCtrl(event)
    ], stopPropagation)(event)

    if (event.key === 'Escape') return reset()
    else if (event.key === 'Enter') return rename(value)
  }

  const input = () => <input
    className='e3de-card__title'
    ref={inputRef}
    autoFocus
    value={value || ''}
    placeholder={placeholder}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />

  const spanValue = props.editing
    ? value || ''
    : value || placeholder

  const spanStyle = placeholder
    ? { color: '#c0c0c0' }
    : {}

  const span = () =>
    <span
      style={spanStyle}
      className='e3de-card__title'
      placeholder={placeholder}
    >
      {spanValue}
    </span>

  return props.editing === props.id ? input() : span()
}
