/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Radius',
  get: feature => feature.properties.am ? feature.properties.am : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      am: value
    }
  })
})

export default props => <TextProperty {...props}/>
