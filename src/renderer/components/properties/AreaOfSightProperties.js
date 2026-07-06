/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import GridCols2 from './GridCols2'
import ColSpan2 from './ColSpan2'
import { DEFAULT_RADIUS_M, MAX_RADIUS_M } from '../../ol/interaction/area-of-sight'

const formatNumber = value => (typeof value === 'number' ? String(value) : '')

const setProperty = (key, valid) => value => feature => {
  const num = parseFloat(value)
  if (!valid(num)) return feature
  return { ...feature, properties: { ...feature.properties, [key]: num } }
}

const Radius = textProperty({
  label: `Radius [m] (max ${MAX_RADIUS_M})`,
  get: feature => formatNumber(feature.properties?.radius ?? DEFAULT_RADIUS_M),
  set: value => feature => {
    const num = parseFloat(value)
    if (!Number.isFinite(num) || num < 100) return feature
    return {
      ...feature,
      properties: { ...feature.properties, radius: Math.min(num, MAX_RADIUS_M) }
    }
  }
})

const ObserverHeight = textProperty({
  label: 'Observer height [m]',
  get: feature => formatNumber(feature.properties?.observerHeight),
  set: setProperty('observerHeight', num => Number.isFinite(num) && num >= 0)
})

const TargetHeight = textProperty({
  label: 'Target height [m]',
  get: feature => formatNumber(feature.properties?.targetHeight),
  set: setProperty('targetHeight', num => Number.isFinite(num) && num >= 0)
})

const AreaOfSightProperties = (props) => (
  <GridCols2>
    <ObserverHeight {...props} />
    <TargetHeight {...props} />
    <ColSpan2>
      <Radius {...props} />
    </ColSpan2>
  </GridCols2>
)

export default AreaOfSightProperties
