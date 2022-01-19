/* eslint-disable react/prop-types */
import React from 'react'
import ColSpan2 from './ColSpan2'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Additional Information',
  get: feature => feature.properties.h ? feature.properties.h : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      h: value
    }
  })
})

export default props => (
  <ColSpan2>
    <TextProperty {...props}/>
  </ColSpan2>
)
