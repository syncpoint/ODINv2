/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Special C2 HQ',
  get: feature => feature.properties.aa ? feature.properties.aa : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      aa: value
    }
  })
})

export default props => <TextProperty {...props}/>
