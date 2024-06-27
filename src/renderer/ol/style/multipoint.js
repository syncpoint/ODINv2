/* eslint-disable no-multi-spaces */
/* eslint-disable camelcase */

import * as shared from './shared'
import styles from './multipoint-styles'
import { transform } from '../../model/geometry'
import { placement } from './polygon-placement'
import { labels } from './multipoint-styles/labels'

/**
 * dynamicStyle
 * staticStyles
 */
const collectStyles = [next => {
  const { parameterizedSIDC: sidc } = next
  const dynamicStyle = (styles[sidc] || styles.DEFAULT)
  const staticStyles = (labels[sidc] || [])
  return { dynamicStyle, staticStyles }
}, ['parameterizedSIDC']]


/**
 * geometry :: jsts/geom/geometry
 * rewrite :: ...
 * resolution :: Number
 */
const geometry = [next => {
  const { definingGeometry, centerResolution } = next

  // Transform (TS/UTM).
  //
  const { read, write, pointResolution } = transform(definingGeometry)
  const geometry = read(definingGeometry)
  const simplifiedGeometry = geometry
  const resolution = pointResolution(centerResolution)
  const rewrite = ({ geometry, ...props }) => ({ geometry: write(geometry), ...props })
  return { geometry, simplifiedGeometry, rewrite, resolution }
}, ['mode', 'smoothen', 'geometryKey', 'centerResolution']]


/**
 * placement
 */
const labelPlacement = [next => {
  // Explicit labels are exclusively for circular features.
  // We use polygon placement to place these labels based on
  // the point buffer around the features center.
  //
  const { TS, geometry } = next
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  const buffer = TS.pointBuffer(TS.point(C))(segment.getLength())
  return { placement: placement({ TS, geometry: buffer }) }
}, ['geometry']]


export default [
  shared.sidc,
  shared.evalSync,
  collectStyles,
  shared.effectiveStyle,
  geometry,
  labelPlacement,
  shared.selectedStyles,
  shared.styles,
  shared.style
]
