/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Width',
  get: feature => feature.properties.am ? feature.properties.am : null,
  set: value => feature => {
    const { read, write, ...current } = feature
    return {
      ...current,
      properties: {
        ...current.properties,
        am: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
