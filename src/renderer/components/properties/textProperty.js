/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import TextField from './TextField'
import { useServices } from '../hooks'

export default options => {
  const { label, get, set } = options

  const Property = React.forwardRef((props, ref) => {
    const { store } = useServices()
    const inputRef = React.useRef(null)

    // Stable key for the current selection - only changes when different items are selected
    const selectionKey = Object.keys(props.features).sort().join(',')

    const initialValue = () => {
      const features = Object.values(props.features)
      const values = R.uniq(features.map(get))
      return values.length === 1
        ? values[0] !== null ? values[0] : ''
        : 'M/V'
    }

    const [value, setValue] = React.useState(initialValue())

    // Only reset value when selection changes, not on every prop change
    React.useEffect(() => setValue(initialValue()), [selectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

    React.useImperativeHandle(ref, () => {
      return {
        set: value => setValue(value),
        focus: () => inputRef.current.focus()
      }
    }, [])

    const handleChange = ({ target }) => setValue(target.value)

    const handleBlur = async () => {
      if (value === initialValue()) return
      // Read current values from store to avoid stale closure issues
      const keys = Object.keys(props.features)
      const currentValues = await store.dictionary(keys)
      store.update(currentValues, set(value))
    }

    return <TextField
      label={label}
      value={value}
      disabled={props.disabled}
      onChange={handleChange}
      onBlur={handleBlur}
      ref={inputRef}
    />
  })

  return Property
}

