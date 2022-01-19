/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Direction',
  get: feature => feature.properties.q ? feature.properties.q : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      q: value
    }
  })
})

export default props => <TextProperty {...props}/>
