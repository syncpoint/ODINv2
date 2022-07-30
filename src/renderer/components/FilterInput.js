import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'
import { Input } from 'antd'
import { cmdOrCtrl } from '../platform'
import { matcher, stopPropagation, preventDefault } from './events'

/**
 * Input component with debounced value.
 */
const FilterInput = props => {
  const [value, setValue] = React.useState(props.value)
  React.useEffect(() => { setValue(props.value) }, [props.value])

  const updateValue = value => {
    if (R.isNil(value)) return
    setValue(value)
    props.onChange && props.onChange(value)
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End'
    ], preventDefault)(event)

    matcher([
      event => cmdOrCtrl(event) && event.key === 'a',
      ({ key }) => key === ' '
    ], stopPropagation)(event)

    if (event.key === 'Escape') updateValue('')
  }

  return <Input
    autoFocus
    allowClear
    value={value}
    placeholder={props.placeholder}
    size={props.size || 'default'}
    onChange={({ target }) => updateValue(target.value)}
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
