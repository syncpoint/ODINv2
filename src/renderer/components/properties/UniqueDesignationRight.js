/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Unique Designation (Right)',
  get: feature => feature.properties.t ? feature.properties.t1 : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      t1: value
    }
  })
})

export default props => {
  return <TextProperty {...props}/>
}
