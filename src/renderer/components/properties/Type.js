/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Type',
  get: feature => feature.properties.v ? feature.properties.v : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      v: value
    }
  })
})

export default props => <TextProperty {...props}/>
