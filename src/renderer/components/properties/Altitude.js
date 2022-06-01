import React from 'react'
import textProperty from './textProperty'

const AltitudeFrom = textProperty({
  label: 'Altitude (From)',
  get: feature => feature.properties.x ? feature.properties.x : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      x: value
    }
  })
})

const AltitudeTo = textProperty({
  label: 'Altitude (To)',
  get: feature => feature.properties.x1 ? feature.properties.x1 : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      x1: value
    }
  })
})

const Altitude = props =>
  <>
    <AltitudeFrom {...props}/>
    <AltitudeTo {...props}/>
  </>

export default Altitude
