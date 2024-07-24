/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import { readGeometry, writeGeometryObject } from '../../ol/format'
import * as geom from './geometries'

const TextProperty = textProperty({
  label: 'Width [m]',
  get: feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const { am } = geom.rectangleProperties(jtsGeometry)
    return am
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.rectangleProperties(jtsGeometry)
    properties.am = value
    const rectangle = geom.rectangle(jtsGeometry, properties)

    return {
      ...current,
      geometry: writeGeometryObject(write(rectangle)),
      properties: {
        ...current.properties,
        am: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
