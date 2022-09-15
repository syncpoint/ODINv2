/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import TextInput from './TextInput'
import { useServices } from '../hooks'

export default options => {
  const { get, set } = options

  return props => {
    const { store } = useServices()

    const initialValue = () => {
      const styles = Object.values(props)
      const values = R.uniq(styles.map(get))
      return values[0]
    }

    const [value, setValue] = React.useState(initialValue())

    /* eslint-disable react-hooks/exhaustive-deps */
    React.useEffect(() => setValue(initialValue()), [props])

    const handleChange = ({ target }) => setValue(target.value)

    const handleBlur = () => {
      if (value === initialValue()) return
      store.update(props, set(value))
    }

    return <TextInput
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  }
}
