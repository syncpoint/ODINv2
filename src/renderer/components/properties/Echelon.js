/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Section from './Section'
import Select from './Select'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'

const get = feature => MILSTD.echelonCode(feature.properties.sidc ? feature.properties.sidc : null)
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties.sidc, { echelon: value })
  }
})

export default props => {
  const { store } = useServices()

  const initialValue = () => {
    const features = Object.values(props.features)
    const values = R.uniq(features.map(get))
    return values.length === 1
      ? values[0] || '-'
      : '*'
  }

  const [state, setState] = React.useState(initialValue())

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(initialValue()), [props])

  const handleSelectionChanged = event => {
    const { value } = event.target
    setState(value)
    store.update(props.features, set(value))
    console.log(`updating with value ${value}`)
    console.dir(props.features, { depth: 5 })
  }

  return (
    <Section label='Echelon'>
      <Select
        value={state}
        disabled={props.disabled}
        onChange={handleSelectionChanged}
      >
        <option value='-'>N/A</option>
        <option value='A'>Team/Crew - ∅</option>
        <option value='B'>Squad - ⏺</option>
        <option value='C'>Section - ⏺⏺</option>
        <option value='D'>Platoon - ⏺⏺⏺</option>
        <option value='E'>Company - ❙</option>
        <option value='F'>Battalion - ❙ ❙</option>
        <option value='G'>Regiment/Group - ❙ ❙ ❙</option>
        <option value='H'>Brigade - X</option>
        <option value='I'>Division - XX</option>
        <option value='J'>Corps - XXX</option>
        <option value='K'>Army - XXXX</option>
        <option value='L'>Front - XXXXX</option>
        <option value='M'>Region - XXXXXX</option>
        <option value='N'>Command - ＋＋</option>
      </Select>
    </Section>
  )
}
