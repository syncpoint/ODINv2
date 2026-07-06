/* eslint-disable react/prop-types */
import React from 'react'
import { getLength } from 'ol/sphere'
import LineString from 'ol/geom/LineString'
import textProperty from './textProperty'
import GridCols2 from './GridCols2'
import ColSpan2 from './ColSpan2'

const formatHeight = h => (typeof h === 'number' ? h.toFixed(2) : '')

const setHeight = key => value => feature => {
  const num = parseFloat(value)
  if (!Number.isFinite(num) || num < 0) return feature
  return { ...feature, properties: { ...feature.properties, [key]: num } }
}

const ObserverHeight = textProperty({
  label: 'Observer height [m]',
  get: feature => formatHeight(feature.properties?.observerHeight),
  set: setHeight('observerHeight')
})

const TargetHeight = textProperty({
  label: 'Target height [m]',
  get: feature => formatHeight(feature.properties?.targetHeight),
  set: setHeight('targetHeight')
})

const distanceKm = (doc) => {
  const coordinates = doc?.geometry?.type === 'LineString' && doc.geometry.coordinates
  if (!coordinates || coordinates.length < 2) return null
  return getLength(new LineString(coordinates)) / 1000
}

const LineOfSightProperties = (props) => {
  const docs = Object.values(props.features)
  const single = docs.length === 1
  const km = single ? distanceKm(docs[0]) : null

  return (
    <GridCols2>
      <ObserverHeight {...props} />
      <TargetHeight {...props} />
      {single && km !== null && (
        <ColSpan2>
          <div className='form-textfield'>
            <span className='form-textfield__label'>Distance</span>
            <span className='form-textfield__input' style={{ paddingTop: 8 }}>
              {km.toFixed(2)} km
            </span>
          </div>
        </ColSpan2>
      )}
    </GridCols2>
  )
}

export default LineOfSightProperties
