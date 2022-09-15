/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Select from './Select'
import { useServices } from '../hooks'

const get = style => style['color-scheme']
const set = value => style => ({
  ...style,
  'color-scheme': value
})

export default props => {
  const { store } = useServices()

  const initialValue = () => {
    const styles = Object.values(props)
    const values = R.uniq(styles.map(get))
    return values[0]
  }

  const [state, setState] = React.useState(initialValue())

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(initialValue()), [props])

  const handleSelectionChanged = event => {
    const { value } = event.target
    setState(value)
    store.update(props, set(value))
  }

  return (
    <>
      <span>Color Scheme</span>
      <Select
        value={state}
        onChange={handleSelectionChanged}
      >
        <option value='light'>Light</option>
        <option value='medium'>Medium</option>
        <option value='dark'>Dark</option>
      </Select>
      <span/>
    </>
  )
}
