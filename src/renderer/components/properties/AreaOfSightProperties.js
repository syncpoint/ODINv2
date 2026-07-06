/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import GridCols2 from './GridCols2'
import ColSpan2 from './ColSpan2'
import { DEFAULT_RADIUS_M, MAX_RADIUS_M } from '../../ol/interaction/area-of-sight'

const formatNumber = value => (typeof value === 'number' ? String(value) : '')

const setHeight = key => value => feature => {
  const num = parseFloat(value)
  if (!Number.isFinite(num) || num < 0) return feature
  return { ...feature, [key]: num }
}

const Radius = textProperty({
  label: `Radius [m] (max ${MAX_RADIUS_M})`,
  get: feature => formatNumber(feature.radius ?? DEFAULT_RADIUS_M),
  set: value => feature => {
    const num = parseFloat(value)
    if (!Number.isFinite(num) || num < 100) return feature
    return { ...feature, radius: Math.min(num, MAX_RADIUS_M) }
  }
})

const ObserverHeight = textProperty({
  label: 'Observer height [m]',
  get: feature => formatNumber(feature.observerHeight),
  set: setHeight('observerHeight')
})

const TargetHeight = textProperty({
  label: 'Target height [m]',
  get: feature => formatNumber(feature.targetHeight),
  set: setHeight('targetHeight')
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
