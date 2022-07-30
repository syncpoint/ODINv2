import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'antd'
import { cmdOrCtrl } from '../platform'
import { useDebounce } from './hooks'
import { matcher, stopPropagation, preventDefault } from './events'

/**
 * Input component with debounced value.
 */
const FilterInput = props => {
  const { onChange } = props

  /**
   * value :: string
   * Value (not debounced) is managed because it
   *  1. might be supplied through props.value
   *  2. can actively be reset by hitting escape key
   */
  const [value, setValue] = React.useState(props.value || '')
  const debouncedValue = useDebounce(value, 100)

  // Pass debounced value to parent:
  React.useEffect(() => {
    onChange && onChange(debouncedValue || '')
  }, [onChange, debouncedValue])

  React.useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const handleChange = ({ target }) => setValue(target.value)

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End'
    ], preventDefault)(event)

    matcher([
      event => cmdOrCtrl(event) && event.key === 'a',
      ({ key }) => key === ' '
    ], stopPropagation)(event)

    if (event.key === 'Escape') setValue('')
  }

  return <Input
    autoFocus
    allowClear
    value={value}
    placeholder={props.placeholder}
    size={props.size || 'default'}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
    onClick={stopPropagation}
  />
}

FilterInput.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  onChange: PropTypes.func
}

FilterInput.whyDidYouRender = true

/**
 * Memoized version prevents re-render on same props.
 * This will be caused by parent, when one or more siblings must
 * be rendered, but props for this component remain unchanged.
 */
const FilterInputMemo = React.memo(FilterInput)
FilterInputMemo.whyDidYouRender = true
export { FilterInputMemo as FilterInput }
