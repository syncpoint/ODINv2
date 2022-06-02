/* eslint-disable react/prop-types */
import React from 'react'
import ColSpan2 from './ColSpan2'
import textProperty from './textProperty'

const TextProperty = textProperty({
  label: 'Name',
  get: feature => feature.name ? feature.name : null,
  set: value => feature => ({ ...feature, name: value })
})

export default props =>
  <ColSpan2>
    <TextProperty {...props}/>
  </ColSpan2>
