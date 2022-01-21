/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Attitude',
  get: feature => feature.properties.an ? feature.properties.an : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      an: value
    }
  })
})

export default props => <TextProperty {...props}/>
