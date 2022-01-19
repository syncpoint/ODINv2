/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Unique Designation',
  get: feature => feature.properties.t ? feature.properties.t : null,
  set: value => feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      t: value
    }
  })
})

export default props => {
  return <TextProperty {...props}/>
}
