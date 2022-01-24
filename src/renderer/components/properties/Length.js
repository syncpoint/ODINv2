/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import { readGeometry, writeGeometryObject } from '../../model/geometry'
import * as geom from './geometries'

const TextProperty = textProperty({
  label: 'Length',
  get: feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const { am1 } = geom.rectangleProperties(jtsGeometry)
    return am1
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.rectangleProperties(jtsGeometry)
    properties.am1 = value
    const rectangle = geom.rectangle(jtsGeometry, properties)

    return {
      ...current,
      geometry: writeGeometryObject(write(rectangle)),
      properties: {
        ...current.properties,
        am1: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
