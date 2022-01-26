/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Section from './Section'
import Select from './Select'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'

const get = feature => MILSTD.mobilityCode(feature.properties.sidc ? feature.properties.sidc : null)
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties.sidc, { mobility: value })
  }
})

export default props => {
  const { store } = useServices()

  const initialValue = () => {
    const features = Object.values(props.state)
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
    const features = Object.values(props.state)
    store.update(features.map(set(value)), features)
  }

  return (
    <Section label='Mobility'>
      <Select
        value={state}
        onChange={handleSelectionChanged}
      >
        <option value={'--'}>N/A</option>
        <option value={'MO'}>Wheeled</option>
        <option value={'MP'}>Cross Country</option>
        <option value={'MQ'}>Tracked</option>
        <option value={'MR'}>Wheeled/Tracked</option>
        <option value={'MS'}>Towed</option>
        <option value={'MT'}>Rail</option>
        <option value={'MU'}>Over the Snow</option>
        <option value={'MV'}>Sled</option>
        <option value={'MW'}>Pack Animals</option>

        {/*
          Possibly wrong in milsymbol (Barge: MX, Amphibious: MY)
          see https://github.com/spatialillusions/milsymbol/issues/224
        */}
        <option value={'MY'}>Barge</option>
        <option value={'MZ'}>Amphibious</option>
      </Select>
    </Section>
  )
}
