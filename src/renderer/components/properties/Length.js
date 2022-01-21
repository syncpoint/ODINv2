/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Length',
  get: feature => feature.properties.am1 ? feature.properties.am1 : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      am1: value
    }
  })
})

export default props => <TextProperty {...props}/>
