/* eslint-disable react/prop-types */
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import ColSpan2 from './ColSpan2'
import FlexRow from './FlexRow'
import textProperty from './textProperty'
import { useServices, useMemento } from '../hooks'

const Button = props => {
  const handleClick = path => event => props.onClick && props.onClick(path, event)

  return (
    <button
      className='properties__button'
      onClick={handleClick(props.path)}
    >
      <Icon path={mdi[props.path]} size='20px'/>
    </button>
  )
}

const TextProperty = props => {
  const { coordinatesFormat } = useServices()
  const { format } = props

  const get = feature => {
    const geometry = feature.geometry
    const coordinates = geometry.coordinates
    return coordinatesFormat.format(coordinates, format)
  }

  const set = value => feature => {
    try {
      const coordinates = coordinatesFormat.parse(value, format)
      feature.geometry.coordinates = coordinates
    } catch (err) {
      /* TODO: handle parse error */
    }

    return feature
  }

  return textProperty({ label: 'Coordinates', get, set })(props)
}

const Coordinates = props => {
  const [format] = useMemento('coordinates-format', 'MGRS')
  return (
    <ColSpan2>
      <FlexRow>
        <TextProperty {...props} format={format}/>
        <div style={{ marginLeft: 'auto' }}>
          <Button path='mdiCrosshairsGps'/>
        </div>
      </FlexRow>
    </ColSpan2>
  )
}

export default Coordinates
