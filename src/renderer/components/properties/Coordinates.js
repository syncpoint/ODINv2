/* eslint-disable react/prop-types */
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import ColSpan2 from './ColSpan2'
import FlexRow from './FlexRow'
import textProperty from './textProperty'
import { Tooltip } from 'react-tooltip'
import { useServices, useMemento } from '../hooks'

const Button = props => {
  const handleClick = path => event => props.onClick && props.onClick(path, event)

  return (
    <button
      className='properties__icon__button'
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
      console.error(err)
    }

    return feature
  }

  const TP = textProperty({ label: 'Coordinates', get, set })
  return <TP {...props} />
}

const Coordinates = props => {
  const [format] = useMemento('coordinates-format', 'MGRS')
  return (
    <ColSpan2>
      <FlexRow>
        <TextProperty {...props} format={format}/>
        <div style={{ marginLeft: 'auto' }} className='tt-apply-coordinates'>
          <Button path='mdiCrosshairsGps' />
        </div>
        <Tooltip anchorSelect='.tt-apply-coordinates' content='Apply coordinates' delayShow={750}/>
      </FlexRow>
    </ColSpan2>
  )
}

export default Coordinates
