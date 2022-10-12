/* eslint-disable react/prop-types */
import React from 'react'
import Color from 'color'
import { useServices } from '../hooks'
import { Palette } from '../colors/Palette'
import Range from './Range'
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
  const colorScheme = value['color-scheme'] || 'medium'
  const lineColor = value['line-color']
  const outlineColor = value['line-halo-color']
  const symbolSize = value['symbol-size'] || 60
  const symbolOutlineColor = value['symbol-halo-color']
  const symbolFillOpacity = value['symbol-fill-opacity'] !== undefined ? value['symbol-fill-opacity'] : 1
  const symbolLineWidth = value['symbol-line-width'] || 3
  const lineWidth = value['line-width'] || 2
  const lineHaloWidth = value['line-halo-width'] || 1

  const update = newValue => store.update([key], [newValue], [value])

  const setColorScheme = ({ target }) => update({
    ...value,
    'color-scheme': target.value === '0' ? 'dark' : target.value === '1' ? 'medium' : 'light'
  })

  const setLineColor = color => update({
    ...value,
    'line-color': color,
    'symbol-color': color ? Color(color).rgb().string() : undefined
  })

  const setLineWidth = ({ target }) => update({
    ...value,
    'line-width': parseInt(target.value)
  })

  const setOutlineColor = color => update({
    ...value,
    'line-halo-color': color,
    'line-halo-width': color ? 1 : 0
  })

  const setLineHaloWidth = ({ target }) => update({
    ...value,
    'line-halo-width': parseInt(target.value)
  })

  const setSymbolSize = ({ target }) => update({
    ...value,
    'symbol-size': parseInt(target.value)
  })

  const setSymbolLineWidth = ({ target }) => update({
    ...value,
    'symbol-line-width': parseInt(target.value)
  })

  const setSymbolOutlineColor = color => update({
    ...value,
    'symbol-halo-color': color ? Color(color).rgb().string() : undefined,
    'symbol-halo-width': color ? 3 : 0
  })

  const setSymbolFillOpacity = ({ target }) => update({
    ...value,
    'symbol-fill-opacity': parseFloat(target.value)
  })

  return (
    <div className='a0d5-panel'>
      <div className='a0d5-card'>
        <label>Color Scheme</label>
        <Range
          min='0'
          max='2'
          step='1'
          value={colorScheme === 'dark' ? 0 : colorScheme === 'medium' ? 1 : 2}
          onChange={setColorScheme}
        >
          <option value='0'>Dark</option>
          <option value='1'>Medium</option>
          <option value='2'>Light</option>
        </Range>
      </div>
      <div className='a0d5-card'>
        <div>
          <label>Line Color</label>
          <Palette color={lineColor} colors={lineColors} onChange={setLineColor}/>
        </div>
        <div>
          <label>Line Width</label>
          <Range
            min='1'
            max='4'
            step='1'
            value={lineWidth}
            onChange={setLineWidth}
          >
            <option value='1'>S</option>
            <option value='2'>M</option>
            <option value='3'>L</option>
            <option value='4'>XL</option>
          </Range>
        </div>
        <div>
          <label>Outline Color</label>
          <Palette color={outlineColor} colors={outlineColors} onChange={setOutlineColor}/>
        </div>
        <div>
          <label>Outline Width</label>
          <Range
            min='1'
            max='4'
            step='1'
            value={lineHaloWidth}
            onChange={setLineHaloWidth}
          >
            <option value='1'>S</option>
            <option value='2'>M</option>
            <option value='3'>L</option>
            <option value='4'>XL</option>
          </Range>
        </div>
      </div>
      <div className='a0d5-card'>
        <div>
          <label>Symbol Size</label>
          <Range
            min='40'
            max='80'
            step='10'
            value={symbolSize}
            onChange={setSymbolSize}
          >
            <option value='40'>XS</option>
            <option value='50'>S</option>
            <option value='60'>M</option>
            <option value='70'>L</option>
            <option value='80'>XL</option>
          </Range>
        </div>
        <div>
          <label>Symbol Line Width</label>
          <Range
            min='3'
            max='9'
            step='2'
            value={symbolLineWidth}
            onChange={setSymbolLineWidth}
          >
            <option value='3'>S</option>
            <option value='5'>M</option>
            <option value='7'>L</option>
            <option value='9'>XL</option>
          </Range>
        </div>
        <div>
          <label>Symbol Outline Color</label>
          <Palette
            format='rgb'
            color={symbolOutlineColor}
            colors={outlineColors}
            onChange={setSymbolOutlineColor}
          />
        </div>
        <div>
          <label>Symbol Fill Opacity</label>
          <Range
            min='0'
            max='1'
            step='0.1'
            value={symbolFillOpacity}
            onChange={setSymbolFillOpacity}
          >
            <option value='0'>Transparent</option>
            <option value='0.1'/>
            <option value='0.2'/>
            <option value='0.3'/>
            <option value='0.4'/>
            <option value='0.5'/>
            <option value='0.6'/>
            <option value='0.7'/>
            <option value='0.8'/>
            <option value='0.9'/>
            <option value='1'>Opaque</option>
          </Range>
        </div>
      </div>
    </div>
  )
}

export default LayerStyles
