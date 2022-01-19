/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Higher Formation',
  get: feature => feature.properties.m ? feature.properties.m : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      m: value
    }
  })
})

export default props => <TextProperty {...props}/>
