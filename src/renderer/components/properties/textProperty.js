/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import TextField from './TextField'
import { useServices } from '../hooks'

export default options => {
  const { label, get, set } = options

  const Property = props => {
    const { featureStore } = useServices()

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

    const handleChange = ({ target }) => setValue(target.value)

    const handleBlur = () => {
      if (value === initialValue()) return
      featureStore.update(props.features, set(value))
    }

    return <TextField
      label={label}
      value={value}
      disabled={props.disabled}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  }

  return Property
}
