/* eslint-disable camelcase */
import * as shared from './shared'
import styles from './corridor-styles'
import { transform } from '../../model/geometry'

const rules = [
  shared.sidc,
  shared.evalTextField,
  shared.effectiveStyle
]


/**
 * geometry :: jsts/geom/geometry
 * write :: jsts/geom/geometry -> ol/geom/geometry
 * resolution :: Number
 */
rules.push([next => {
  const { definingGeometry, centerResolution } = next

  // Transform (TS/UTM).
  //
  const { read, write, pointResolution } = transform(definingGeometry)
  const geometry = read(definingGeometry)
  const resolution = pointResolution(centerResolution)

  return {
    geometry,
    write,
    resolution,
    calculatedStyles: null,
    style: null
  }
}, ['mode', 'smoothen', 'geometryKey', 'centerResolution']])


/**
 * styleSpecifications
 */
rules.push([next => {
  const { parameterizedSIDC: sidc } = next
  const styleSpecification = (styles[sidc] || styles.DEFAULT)
  return { styleSpecification }
}, ['parameterizedSIDC']])


/**
 * style :: [ol/style/Style]
 */
rules.push([next => {
  const { styleFactory, styleSpecification, write, evalTextField } = next
  const style = styleSpecification(next)
    .map(({ geometry, ...props }) => ({ geometry: write(geometry), ...props }))
    .flatMap(evalTextField)
    .flatMap(styleFactory)

  return { style }
}, ['geometry', 'styleFactory', 'styleSpecification', 'evalTextField']])


/**
 * style :: [ol/style/Style]
 */
rules.push([next => {
  const { styleFactory, write } = next
  const style = styles.ERROR(next)
    .map(({ geometry, ...options }) => ({ geometry: write(geometry), ...options }))
    .flatMap(styleFactory)

  return { style }
}, ['err']])


export default rules
