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

    const initialValue = () => {
      const features = Object.values(props.features)
      const values = R.uniq(features.map(get))
      return values.length === 1
        ? values[0] !== null ? values[0] : ''
        : 'M/V'
    }

    const [value, setValue] = React.useState(initialValue())

    /* eslint-disable react-hooks/exhaustive-deps */
    React.useEffect(() => setValue(initialValue()), [props])

    React.useImperativeHandle(ref, () => {
      return {
        set: value => setValue(value),
        focus: () => inputRef.current.focus()
      }
    }, [])

    const handleChange = ({ target }) => setValue(target.value)

    const handleBlur = () => {
      if (value === initialValue()) return
      store.update(props.features, set(value))
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

