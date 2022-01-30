/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Section from './Section'
import Select from './Select'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'

const get = feature => MILSTD.statusCode(feature.properties.sidc ? feature.properties.sidc : null)
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties.sidc, { status: value })
  }
})

export default props => {
  const { store } = useServices()

  const initialValue = () => {
    const features = Object.values(props.features)
    const values = R.uniq(features.map(get))
    return values.length === 1
      ? values[0] || 'P'
      : '*'
  }

  const [state, setState] = React.useState(initialValue())

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(initialValue()), [props])

  const handleSelectionChanged = event => {
    const { value } = event.target
    setState(value)
    const features = Object.values(props.features)
    store.update(features.map(set(value)), features)
  }

  return state !== 'A'
    ? <Section label='Operational Condition'>
        <Select
          value={state}
          onChange={handleSelectionChanged}
        >
          <option value='P'>N/A</option>
          <option value='C'>Fully Capable</option>
          <option value='D'>Damaged</option>
          <option value='X'>Destroyed</option>
          <option value='F'>Full to Capacity</option>
        </Select>
      </Section>
    : null
}
