/* eslint-disable react/prop-types */
import React from 'react'
import textProperty from './textProperty'
import { readGeometry, writeGeometryObject } from '../../store/FeatureStore'
import * as geom from './geometries'

const TextProperty = textProperty({
  label: 'DZ2 Width [m]',
  get: feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const { dz2Width } = geom.artilleryProperties(jtsGeometry)
    return Math.round(dz2Width)
  },
  set: value => feature => {
    const { read, write, ...current } = feature
    const olGeometry = readGeometry(current.geometry)
    const jtsGeometry = read(olGeometry)
    const properties = geom.artilleryProperties(jtsGeometry)
    properties.dz2Width = Number(value)
    const corridor = geom.artillery(jtsGeometry, properties)

    return {
      ...current,
      geometry: writeGeometryObject(write(corridor)),
      properties: {
        ...current.properties,
        dz2Width: value
      }
    }
  }
})

export default props => <TextProperty {...props}/>
