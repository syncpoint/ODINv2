/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import ColSpan2 from './ColSpan2'
import Checkbox from './Checkbox'
import MarginBottom3 from './MarginBottom3'
import Section from './Section'
import Range from './Range'
import { useServices } from '../hooks'

const GridCols = ({ children }) => {
  const style = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gap: '0.5rem' // gap-4
  }

  return (
    <div style={style}>
      {children}
    </div>
  )
}

const Label = ({ children }) => <label style={{ lineHeight: '1' }}>{children}</label>

const reliabilities = [
  'completely reliable',
  'usually reliable',
  'fairly reliable',
  'not usually reliable',
  'unreliable',
  'unknown'
]

const credibilities = [
  'confirmed',
  'probably true',
  'possibly true',
  'doubtfully true',
  'improbable',
  'unknown'
]

const get = feature => feature.properties.j ? feature.properties.j : null
const set = value => feature => {
  if (value !== '') {
    return {
      ...feature,
      properties: {
        ...feature.properties,
        j: value
      }
    }
  } else {
    const { j, ...properties } = feature.properties
    return { ...feature, properties }
  }
}

export default props => {
  const { featureStore } = useServices()

  const initialValue = () => {
    const features = Object.values(props.features)
    const values = R.uniq(features.map(get))
    return values.length === 1
      ? values[0] !== null ? values[0] : ''
      : 'F6'
  }

  const [state, setState] = React.useState(initialValue())

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => setState(initialValue()), [props])

  const reliabilityCode = state => state.charCodeAt(0) - 65
  const credibilityCode = state => parseInt(state[1])
  const stateFromReliability = value => String.fromCharCode(65 + value) + state[1]
  const stateFromCredibility = value => state[0] + value

  const update = state => {
    setState(state)
    featureStore.update(props.features, set(state))
  }

  const handleReliabilityChange = ({ target }) => {
    update(stateFromReliability(parseInt(target.value)))
  }

  const handleCredibilityChange = ({ target }) => {
    update(stateFromCredibility(target.value))
  }

  const handleAvailableChanged = ({ target }) => {
    if (target.checked) update('A1')
    else update('')
  }

  const sliders = () => state !== ''
    ? <>
        <GridCols>
          <label>Reliability</label>
          <Range
            min='0'
            max='5'
            step='1'
            value={reliabilityCode(state)}
            disabled={props.disabled}
            onChange={handleReliabilityChange}
          >
            <option value='0'>A</option>
            <option value='1'>B</option>
            <option value='2'>C</option>
            <option value='3'>D</option>
            <option value='4'>E</option>
            <option value='5'>F</option>
          </Range>
          <Label>{reliabilities[reliabilityCode(state)]}</Label>
        </GridCols>
        <GridCols>
          <label>Credibility</label>
          <Range
            min='1'
            max='6'
            step='1'
            value={credibilityCode(state)}
            disabled={props.disabled}
            onChange={handleCredibilityChange}
          >
            <option value='0'>1</option>
            <option value='1'>2</option>
            <option value='2'>3</option>
            <option value='3'>4</option>
            <option value='4'>5</option>
            <option value='5'>6</option>
          </Range>
          <Label>{credibilities[credibilityCode(state) - 1]}</Label>
        </GridCols>
      </>
    : null

  return (
    <ColSpan2>
      <Section label='Evaluation Rating'>
        <Checkbox
          label='Available'
          checked={state !== ''}
          disabled={props.disabled}
          onChange={handleAvailableChanged}
        />
        { sliders() }
      </Section>
      <MarginBottom3/>
    </ColSpan2>
  )
}
