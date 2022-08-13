/* eslint-disable react/prop-types */
import React from 'react'
import { useServices } from '../hooks'
import { matcher, stopPropagation } from '../events'
import { cmdOrCtrl } from '../../platform'


/**
 *
 */
export const Title = props => {
  const { store } = useServices()
  const [value, setValue] = React.useState(props.value)
  const ref = React.useRef()
  const placeholder = value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'


  React.useEffect(() => { setValue(props.value) }, [props.value])

  // Pre-emptively focus sidebar to keep getting key events.
  // Note: This also keeps focus on sidebar when tab is pressed while editing.
  //
  const focusSidebar = () => {
    document.getElementsByClassName('e3de-sidebar')[0].focus()
  }

  const rename = name => {
    focusSidebar()
    if (props.value !== name) store.rename(props.editing, name.trim())
  }

  const reset = () => {
    focusSidebar()
    setValue(props.value)
  }

  const handleChange = ({ target }) => setValue(target.value)
  const handleBlur = () => { if (value) rename(value) }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === ' ',
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp',
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End',
      event => event.key === 'a' && cmdOrCtrl(event)
    ], stopPropagation)(event)

    if (event.key === 'Escape') return reset()
    else if (event.key === 'Enter') return rename(value)
    else if (event.key === 'Tab') return rename(value)
  }

  const input = () => <input
    className='e3de-card__title'
    ref={ref}
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

  const className = props.highlight
    ? 'e3de-card__title e3de-card__title--highlight'
    : 'e3de-card__title'

  const span = () =>
    <span
      style={spanStyle}
      className={className}
      placeholder={placeholder}
    >
      {spanValue}
    </span>

  return props.editing === props.id ? input() : span()
}
