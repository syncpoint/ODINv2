/* eslint-disable react/prop-types */
import React from 'react'
import inputProperty from './inputProperty'

const Property = inputProperty({
  get: style => style['line-width'],
  set: value => style => ({
    ...style,
    'line-width': Number.parseFloat(value)
  })
})

export default props => <Property {...props}/>
