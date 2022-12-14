import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from '../hooks'
import { cmdOrCtrl } from '../../platform'
import { matcher, stopPropagation } from '../events'
import './CardTitle.css'

/**
 *
 */
const CardTitle = props => {
  const { store } = useServices()
  const [value, setValue] = React.useState(props.value)
  const placeholder = value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'

  const rename = name => {
    if (props.value === name) return
    store.rename(props.id, name)
  }

  const reset = () => setValue(props.value)

  React.useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const handleChange = ({ target }) => setValue(target.value)

  const handleBlur = () => {
    if (!value) return
    rename(value.trim())
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === ' ',
      event => event.key === 'a' && cmdOrCtrl(event)
    ], stopPropagation)(event)

    if (event.key === 'Escape') return reset()
    else if (event.key === 'Enter') return rename(value.trim())
  }

  const input = () => <input
    className='card-title'
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
      className='card-title'
      placeholder={placeholder}
    >{spanValue}</span>

  return props.editing ? input() : span()
}

CardTitle.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  editing: PropTypes.bool.isRequired
}

CardTitle.whyDidYouRender = true

const CardTitleMemo = React.memo(CardTitle)
CardTitleMemo.whyDidYouRender = true

export { CardTitleMemo as CardTitle }
