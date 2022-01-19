/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Speed',
  get: feature => feature.properties.z ? feature.properties.z : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      z: value
    }
  })
})

export default props => <TextProperty {...props}/>
