/* eslint-disable react/prop-types */
import React from 'react'
import ColSpan2 from './ColSpan2'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Date-Time Group',
  get: feature => feature.properties.w ? feature.properties.w : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      w: value
    }
  })
})

export default props => (
  <ColSpan2>
    <TextProperty {...props}/>
  </ColSpan2>
)
