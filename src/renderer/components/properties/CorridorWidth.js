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
    const { am } = geom.corridorProperties(jtsGeometry)
    return am
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.corridorProperties(jtsGeometry)
    properties.am = value
    const corridor = geom.corridor(jtsGeometry, properties)

    return {
      ...current,
      geometry: writeGeometryObject(write(corridor)),
      properties: {
        ...current.properties,
        am: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
