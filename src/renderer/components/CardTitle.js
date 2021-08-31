import React from 'react'
import PropTypes from 'prop-types'

/**
 *
 */
const CardTitle = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)

  React.useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const handleBlur = () => {
    if (props.value === value) return
    props.onChange(props.id, value.trim())
  }

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => event.stopPropagation()
  const placeholder = value ? null : 'N/A (click to edit)'

  const input = () => <input
    className='card-title'
    value={value || ''}
    placeholder={placeholder}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />

  return input()
}

CardTitle.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
}

CardTitle.whyDidYouRender = true

const CardTitleMemo = React.memo(CardTitle)
CardTitleMemo.whyDidYouRender = true

export { CardTitleMemo as CardTitle }