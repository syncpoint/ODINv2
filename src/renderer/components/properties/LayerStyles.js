/* eslint-disable react/prop-types */
import React from 'react'
import * as Colors from 'css-color-converter'
import { useServices } from '../hooks'
import './Styles.scss'

const descriptors = [
  { label: 'Color Scheme', type: 'scheme', binding: 'color-scheme' },
  { label: 'Line Width', type: 'number', binding: 'line-width' },
  { label: 'Line Color', type: 'color', binding: 'line-color' },
  { label: 'Line Halo Width', type: 'number', binding: 'line-halo-width' },
  { label: 'Line Halo Color', type: 'color', binding: 'line-halo-color' },
  { label: 'Line Smoothen', type: 'boolean', binding: 'line-smooth' },
  { label: 'Symbol Line Width', type: 'number', binding: 'symbol-line-width' },
  { label: 'Symbol Color', type: 'color', binding: 'symbol-color', format: 'rgb' },
  { label: 'Symbol Halo Color', type: 'color', binding: 'symbol-halo-color', format: 'rgb' },
  { label: 'Symbol Halo Wdith', type: 'number', binding: 'symbol-halo-width' },
  { label: 'Symbol Text Color', type: 'color', binding: 'symbol-text-color', format: 'rgb' },
  { label: 'Symbol Text Halo Color', type: 'color', binding: 'symbol-text-halo-color', format: 'rgb' },
  { label: 'Symbol Text Halo Wdith', type: 'number', binding: 'symbol-text-halo-width' }
]

const LayerStyles = props => {
  const { store } = useServices()

  const keys = Object.keys(props)
  const oldValues = Object.values(props)

  const input = property => {

    if (property.type === 'scheme') {
      const handleChange = event => {
        const { target } = event
        const newValues = oldValues.map(value => ({ ...value, [property.binding]: target.value }))
        store.update(keys, newValues, oldValues)
      }

      return (
        <select
          value={oldValues[0][property.binding]}
          onChange={handleChange}
        >
          <option value='light'>Light</option>
          <option value='medium'>Medium</option>
          <option value='dark'>Dark</option>
        </select>
      )
    } else if (property.type === 'number') {
      const handleChange = event => {
        const { target } = event
        const newValues = oldValues.map(value => ({ ...value, [property.binding]: Number.parseFloat(target.value) || 1 }))
        store.update(keys, newValues, oldValues)
      }

      return (
        <>
          <button style={{ width: '1rem' }}>-</button>&nbsp;
          <input
            type='text'
            className='a0d5-text-input'
            value={Number.parseFloat(oldValues[0][property.binding])}
            onChange={handleChange}
            />&nbsp;
          <button style={{ width: '1rem' }}>+</button>
        </>
      )
    } else if (property.type === 'color') {
      const handleChange = event => {
        const { target } = event
        const colorValue = property.format === 'rgb'
          ? Colors.fromString(target.value).toRgbString()
          : target.value

        const newValues = oldValues.map(value => ({ ...value, [property.binding]: colorValue }))
        store.update(keys, newValues, oldValues)
      }
      const value = Colors.fromString(oldValues[0][property.binding] || '#000000').toHexString()
      return (
        <input
          type='color'
          value={value}
          onChange={handleChange}
        />
      )
    } else if (property.type === 'boolean') {
      const handleChange = event => {
        const { target } = event
        const newValues = oldValues.map(value => ({ ...value, [property.binding]: target.checked }))
        store.update(keys, newValues, oldValues)
      }

      // FIXME: Why is `checked` unknown?
      /* eslint-disable react/no-unknown-property */
      return (
        <input
          type='checkbox'
          className='a0d5-toggle'
          checked={oldValues[0][property.binding]}
          onChange={handleChange}
        />
      )
      /* eslint-enable react/no-unknown-property */
    }
  }

  const rows = descriptors.map(property => {
    const enabledProperty = `enabled-${property.binding}`
    const checked = !!oldValues[0][enabledProperty]

    const handleChange = event => {
      const { target } = event
      const newValues = oldValues.map(value => ({ ...value, [enabledProperty]: target.checked }))
      store.update(keys, newValues, oldValues)
    }

    /* eslint-disable react/no-unknown-property */
    return (
      <div className='a0d5-row' key={property.binding}>
        <input
          type='checkbox'
          className='a0d5-switch'
          id={property.binding}
          checked={checked}
          onChange={handleChange}
        />
        <label
          className='a0d5-row__label'
          htmlFor={property.binding}
        >
          {property.label}
        </label>
        <div className='a0d5-row__input'>
          { input(property) }
        </div>
      </div>
    )
    /* eslint-enable react/no-unknown-property */
  })

  return (
    <div>
      { rows }
    </div>
  )
}

export default LayerStyles
