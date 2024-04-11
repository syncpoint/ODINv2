/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import { readGeometry, writeGeometryObject } from '../../store/FeatureStore'
import * as geom from './geometries'

const TextProperty = textProperty({
  label: 'DZ1 Near Depth [m]',
  get: feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const { dz1NearDepth } = geom.artilleryProperties(jtsGeometry)
    return Math.round(dz1NearDepth)
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.artilleryProperties(jtsGeometry)
    properties.dz1NearDepth = Number(value)
    const corridor = geom.artillery(jtsGeometry, properties)

    return {
      ...current,
      geometry: writeGeometryObject(write(corridor)),
      properties: {
        ...current.properties,
        dz1NearDepth: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
