/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import ColSpan2 from './ColSpan2'
import MarginTop3 from './MarginTop3'
import MarginBottom3 from './MarginBottom3'
import GridCols2 from './GridCols2'
import Section from './Section'
import FlexColumn from './FlexColumn'
import Checkbox from './Checkbox'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'

const get = feature => MILSTD.modifierCode(feature.properties.sidc ? feature.properties.sidc : null)
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties.sidc, { modifier: value })
  }
})

const decode = value => {
  switch (value) {
    case 'F': return [false, false, true]
    case 'E': return [false, true, false]
    case 'G': return [false, true, true]
    case 'A': return [true, false, false]
    case 'C': return [true, false, true]
    case 'B': return [true, true, false]
    case 'D': return [true, true, true]
    default: return [false, false, false]
  }
}

const encode = state => {
  if (!state[0] && !state[1] && !state[2]) return '*'
  else if (!state[0] && !state[1] && state[2]) return 'F'
  else if (!state[0] && state[1] && !state[2]) return 'E'
  else if (!state[0] && state[1] && state[2]) return 'G'
  else if (state[0] && !state[1] && !state[2]) return 'A'
  else if (state[0] && !state[1] && state[2]) return 'C'
  else if (state[0] && state[1] && !state[2]) return 'B'
  else if (state[0] && state[1] && state[2]) return 'D'
}

export default props => {
  const { featureStore } = useServices()

  const initialValue = () => {
    const features = Object.values(props.features)
    const values = R.uniq(features.map(get))
    return values.length === 1
      ? values[0] || '*'
      : '*'
  }

  const [state, setState] = React.useState(decode(initialValue()))

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(decode(initialValue())), [props])

  const handleChange = index => ({ target }) => {
    const update = [...state]
    update[index] = target.checked
    setState(update)
    const value = encode(update)
    featureStore.update(props.features, set(value))
  }

  return (
    <ColSpan2>
      <MarginTop3/>
      <Section label='Modifiers'>
        <GridCols2>
          <FlexColumn>
            <Checkbox
              name='modifiers'
              label='Headquarters'
              id='hq'
              checked={state[0]}
              disabled={props.disabled}
              onChange={handleChange(0)}
            />
            <Checkbox
              name='modifiers'
              label='Task Force'
              id='tf'
              checked={state[1]}
              disabled={props.disabled}
              onChange={handleChange(1)}
            />
            <Checkbox
              name='modifiers'
              label='Feint/Dummy'
              id='fd'
              checked={state[2]}
              disabled={props.disabled}
              onChange={handleChange(2)}
            />
          </FlexColumn>
        </GridCols2>
      </Section>
      <MarginBottom3/>
    </ColSpan2>
  )
}
