import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import isEqual from 'react-fast-compare'
import * as ID from '../../ids'
import { format } from '../../ol/format'
import styles from '../../ol/style/styles'
import keyequals from '../../ol/style/keyequals'
import { setCoordinates } from '../geometry'

/**
 * Read features from GeoJSON to ol/Feature and
 * create input signals for style calculation.
 */
const readFeature = R.curry((state, source) => {
  const feature = format.readFeature(source)
  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)
  const { geometry, ...properties } = feature.getProperties()

  feature.$ = {

    // A word of caution: It is strongly adviced to NOT use feature signal
    // DIRECTLY to derive style! Setting the featues style will update the
    // feature's revision and thus lead to an infinite loop.
    // Always make sure to extract relevant information from feature into
    // new signals which conversely are only updated when this information
    // has actually changed.
    //
    properties: Signal.of(properties, { equals: isEqual }),
    geometry: Signal.of(geometry, { equals: keyequals() }),
    globalStyle: Signal.of(state.styles[ID.defaultStyleId]),
    layerStyle: Signal.of(state.styles[ID.styleId(layerId)] ?? {}),
    featureStyle: Signal.of(state.styles[ID.styleId(featureId)] ?? {}),
    centerResolution: Signal.of(state.resolution),
    selectionMode: Signal.of('default')
  }

  const setStyle = feature.setStyle.bind(feature)
  styles(feature).on(setStyle)

  // Use dedicated function to update feature coordinates from within
  // modify interaction. Such internal changes must not trigger ModifyEvent.

  feature.internalChange = Signal.of(false)

  feature.updateCoordinates = coordinates => {
    feature.internalChange(true)
    setCoordinates(feature.getGeometry(), coordinates)
    feature.internalChange(false)
  }

  feature.commit = () => {
    // Event must be deferred so that event handler has a chance
    // to update to a new state (drag -> selected).
    setTimeout(() => feature.dispatchEvent({ type: 'change', target: feature }))
  }

  feature.on('change', ({ target }) => {
    const { geometry, ...properties } = target.getProperties()
    target.$.properties(properties)
    target.$.geometry(geometry)
  })

  return feature
})

export default readFeature
