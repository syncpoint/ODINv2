/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import ColSpan2 from './ColSpan2'
import MarginTop3 from './MarginTop3'
import Section from './Section'
import Radio from './Radio'
import { useServices } from '../hooks'

const get = feature => feature.properties.f ? feature.properties.f : null
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    f: value
  }
})

export default props => {
  const { store } = useServices()

  const initialValue = () => {
    const features = Object.values(props.state)
    const values = R.uniq(features.map(get))
    return values.length === 1
      ? values[0] || ''
      : '*'
  }

  const [value, setValue] = React.useState(initialValue())

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setValue(initialValue()), [props])

  const handleChange = value => () => {
    console.log('handleChange', value)
    setValue(value)
    const features = Object.values(props.state)
    store.update(features.map(set(value)), features)
  }

  return (
    <ColSpan2>
    <MarginTop3/>
    <Section label='Reinforced/Reduced'>
      <div style={{
        display: 'grid',
        gridAutoColumns: 'minmax(0, 1fr)',
        gridAutoFlow: 'column'
      }}>
        <Radio
          name='reinforcement'
          label='None'
          onChange={handleChange('')}
          checked={value === ''}
        />
        <Radio
          name='reinforcement'
          label='(+)'
          onChange={handleChange('(+)')}
          checked={value === '(+)'}
        />
        <Radio
          name='reinforcement'
          label='(—)'
          onChange={handleChange('(—)')}
          checked={value === '(—)'}
        />
        <Radio
          name='reinforcement'
          label='(±)'
          onChange={handleChange('(±)')}
          checked={value === '(±)'}
        />
      </div>
    </Section>
    </ColSpan2>
  )
}

