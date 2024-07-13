/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import { readGeometry, writeGeometryObject } from '../../ol/format'
import * as geom from './geometries'

const TextProperty = textProperty({
  label: 'Radius [m]',
  get: feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const { am } = geom.circleProperties(jtsGeometry)
    return am
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.circleProperties(jtsGeometry)
    properties.am = value
    const circle = geom.circle(jtsGeometry, properties)

    return {
      ...feature,
      geometry: writeGeometryObject(write(circle)),
      properties: {
        ...feature.properties,
        am: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
