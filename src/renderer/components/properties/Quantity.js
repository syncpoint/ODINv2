/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Quantity',
  get: feature => feature.properties.c ? feature.properties.c : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      c: value
    }
  })
})

export default props => <TextProperty {...props}/>
