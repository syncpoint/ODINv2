import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Input } from 'antd'
import { cmdOrCtrl } from '../platform'
import { useDebounce } from './hooks'

/**
 * Input component with debounced value.
 */
const FilterInput = props => {
  const { onChange } = props

  /**
   * value :: string
   * Value (not debounced) is managed because it
   *  1. might be supplied through props.value
   *  2. can actively reset by hitting escape key
   */
  const [value, setValue] = React.useState(props.value || '')
  const debouncedValue = useDebounce(value, 50)

  // Pass debounced value to parent:
  React.useEffect(() => {
    onChange && onChange(debouncedValue)
  }, [onChange, debouncedValue])

  const handleChange = ({ target }) => setValue(target.value)

  const handleKeyDown = event => {
    const preventDefault = R.cond([
      [({ key }) => key === 'Home', R.always(true)],
      [({ key }) => key === 'End', R.always(true)],
      [R.T, R.always(false)]
    ])

    const stopPropagation = R.cond([
      [event => cmdOrCtrl(event) && event.key === 'a', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()
    if (stopPropagation(event)) event.stopPropagation()
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
