/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Section from './Section'
import Checkbox from './Checkbox'
import Select from './Select'
import FlexRow from './FlexRow'
import ColSpan2 from './ColSpan2'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'

// P-PENDING         G-EXCERCISE
// U-UNKNOWN         W-EXCERCISE
// A-ASSUMED FRIEND  M-EXCERCISE
// F-FRIEND          D-EXCERCISE
// N-NEUTRAL         L-EXCERCISE
// S-SUSPECT         N/A
// H-HOSTILE         N/A
// J-JOKER           N/A
// K-FAKER           N/A

const decode = value => {
  switch (value) {
    case 'G': return ['P', true]
    case 'W': return ['U', true]
    case 'M': return ['A', true]
    case 'D': return ['F', true]
    case 'L': return ['N', true]
    default: return [value, false]
  }
}

const encode = (value, checked) => {
  if (!checked) return value
  else if (value === 'P') return 'G'
  else if (value === 'U') return 'W'
  else if (value === 'A') return 'M'
  else if (value === 'F') return 'D'
  else if (value === 'N') return 'L'
}

const get = feature => MILSTD.identityCode(feature.properties.sidc ? feature.properties.sidc : null)
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties.sidc, { identity: value })
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

  const [state, setState] = React.useState(decode(initialValue()))

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(decode(initialValue())), [props])

  const update = state => {
    setState(state)
    const value = encode(state[0], state[1])
    const features = Object.values(props.features)
    store.update(features.map(set(value)), features)
  }

  const handleSelectionChanged = event => {
    const { value } = event.target
    update([value, state[1]])
  }

  const handleExerciseChanged = event => {
    const { checked } = event.target
    update([state[0], checked])
  }

  const exerciseDisabled = ['S', 'H', 'J', 'K'].includes(state[0])

  return (
    <ColSpan2>
      <Section label='Standard Identity'>
        <FlexRow>
          <Select
            value={state[0]}
            onChange={handleSelectionChanged}
          >
            <option value='P'>Pending</option>
            <option value='U'>Unknown</option>
            <option value='A'>Assumed Friend</option>
            <option value='F'>Friend</option>
            <option value='N'>Neutral</option>
            <option value='S'>Suspect</option>
            <option value='H'>Hostile</option>
            <option value='J'>Joker</option>
            <option value='K'>Faker</option>
          </Select>
          <div style={{ marginLeft: 'auto' }}>
            <Checkbox
              label='Exercise'
              disabled={exerciseDisabled}
              checked={!exerciseDisabled && state[1]}
              onChange={handleExerciseChanged}
            />
          </div>
        </FlexRow>
      </Section>
    </ColSpan2>
  )
}
