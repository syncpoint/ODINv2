import React from 'react'
import textProperty from './textProperty'

const EffectiveFrom = textProperty({
  label: 'Effective (From)',
  get: feature => feature.properties.w ? feature.properties.w : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      w: value
    }
  })
})

const EffectiveTo = textProperty({
  label: 'Effective (To)',
  get: feature => feature.properties.w1 ? feature.properties.w1 : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      w1: value
    }
  })
})

export default props =>
  <>
    <EffectiveFrom {...props}/>
    <EffectiveTo {...props}/>
  </>
