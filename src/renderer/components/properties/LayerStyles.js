/* eslint-disable react/prop-types */
import React from 'react'
import Color from 'color'
import { useServices } from '../hooks'
import { Palette } from '../colors/Palette'
import './Styles.scss'

const lineColors = [undefined, 'white', 'black', 'red', 'brown', 'gold', 'green', 'blue', 'purple']
  .map(c => c ? Color(c) : undefined)
  .map(c => c ? c.hex() : undefined)

const outlineColors = [undefined, 'white', 'black']
  .map(c => c ? Color(c) : undefined)
  .map(c => c ? c.hex() : undefined)


const LayerStyles = props => {
  const [key, value] = props.style
  const { store } = useServices()
  const lineColor = value['line-color']
  const outlineColor = value['line-halo-color']

  const update = newValue => store.update([key], [newValue], [value])

  const defaultValue = {
    'text-color': 'black',
    'text-halo-color': 'white',
    'text-halo-width': 2,
    'symbol-text-color': 'black',
    'symbol-text-halo-color': 'white',
    'symbol-text-halo-width': 3
  }

  const setLineColor = color => update({
    ...value,
    ...defaultValue,
    'line-color': color,
    'symbol-color': color ? Color(color).rgb().string() : undefined
  })

  const setOutlineColor = color => update({
    ...value,
    ...defaultValue,
    'line-halo-color': color,
    'line-halo-width': color ? 1 : 0,
    'symbol-halo-color': color ? Color(color).rgb().string() : undefined,
    'symbol-halo-width': color ? 3 : 0
  })

  return (
    <div className='a0d5-panel'>
      <div>
        <label>Line Color</label>
        <Palette color={lineColor} colors={lineColors} onChange={setLineColor}/>
      </div>
      <div>
        <label>Outline Color</label>
        <Palette color={outlineColor} colors={outlineColors} onChange={setOutlineColor}/>
      </div>
    </div>
  )
}

export default LayerStyles
