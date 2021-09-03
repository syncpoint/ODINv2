import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'

/**
 *
 */
const CardTitle = props => {
  const { propertiesStore } = useServices()
  const [value, setValue] = React.useState(props.value)
  const [mode, setMode] = React.useState('display')

  const placeholder = value ? null : 'N/A (click to edit)'

  const rename = value => {
    setMode('display')
    if (props.value === value) return
    propertiesStore.rename(props.id, value)
  }

  const reset = () => {
    setMode('display')
    setValue(props.value)
  }

  React.useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const handleChange = ({ target }) => setValue(target.value)

  const handleClick = () => {
    if (mode === 'display' && props.focused) {
      setMode('edit')
    }
  }

  const handleBlur = () => {
    rename(value.trim())
  }

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => {
    event.stopPropagation()

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

  const span = () => <span
    className='card-title'
    placeholder={placeholder}
    onClick={handleClick}
  >{value || ''}</span>

  return mode === 'display' ? span() : input()
}

CardTitle.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  focused: PropTypes.bool.isRequired
}

CardTitle.whyDidYouRender = true

const CardTitleMemo = React.memo(CardTitle)
CardTitleMemo.whyDidYouRender = true

export { CardTitleMemo as CardTitle }