/* eslint-disable react/prop-types */
import React from 'react'
import { useEmitter } from '../hooks'
import { matcher, stopPropagation } from '../events'
import { cmdOrCtrl } from '../../platform'


/**
 *
 */
export const Title = props => {
  const emitter = useEmitter('sidebar')
  const [value, setValue] = React.useState(props.value)
  const ref = React.useRef()
  const placeholder = value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'


  React.useEffect(() => { setValue(props.value) }, [props.value])

  const commit = () => {
    if (props.value === value) emitter.emit('edit/rollback')
    else emitter.emit('edit/commit', { id: props.editing, value })
  }

  const handleChange = ({ target }) => setValue(target.value)

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === ' ',
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp',
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End',
      ({ key }) => key === 'Escape',
      ({ key }) => key === 'Enter',
      event => event.key === 'a' && cmdOrCtrl(event)
    ], stopPropagation)(event)

    if (event.key === 'Escape') emitter.emit('edit/rollback')
    else if (event.key === 'Enter') emitter.emit('edit/commit', { id: props.editing, value })
  }

  const input = () => <input
    className='e3de-card__title'
    ref={ref}
    autoFocus
    value={value || ''}
    placeholder={placeholder}
    onChange={handleChange}
    onBlur={commit}
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
