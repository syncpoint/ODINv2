/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import FlexColumn from './FlexColumn'
import Section from './Section'
import Radio from './Radio'
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

  const handleChange = value => () => {
    setState(value)
    const features = Object.values(props.features)
    store.update(features.map(set(value)), features)
  }

  return (
    <Section label='Status'>
      <FlexColumn>
        <Radio
          name='status'
          label='Present'
          disabled={props.disabled}
          onChange={handleChange('P')}
          checked={state !== 'A'}
        />
        <Radio
          name='status'
          label='Anticipated'
          disabled={props.disabled}
          onChange={handleChange('A')}
          checked={state === 'A'}
        />
      </FlexColumn>
    </Section>
  )
}
