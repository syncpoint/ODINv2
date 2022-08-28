/* eslint-disable camelcase */
import shared from './shared'
import generic from './generic'
import styles from './polygon-styles'
import labels from './polygon-labels'
import placement from './polygon-placement'

const rules = [
  ...shared,
  ...generic
]

/**
 *
 */
rules.push([() => {
  return { placement: null }
}, ['geometryKey']])


/**
 * simplified, geometry_simplified
 */
rules.push([next => {
  const { definingGeometry, centerResolution, mode } = next

  // Never simplify current selection.
  const simplified = mode === 'singleselect'
    ? false
    : definingGeometry.getCoordinates()[0].length > 50

  const simplifiedGeometry = simplified
    ? definingGeometry.simplify(centerResolution)
    : definingGeometry

  return { simplified, simplifiedGeometry }
}, ['centerResolution', 'mode', 'geometryKey', 'definingGeometry']])


/**
 * labelSpecifications, styleSpecifications
 */
rules.push([next => {
  const { parameterizedSIDC: sidc, evalTextField } = next
  const styleSpecification = (styles[sidc] || styles.DEFAULT)
  const labelSpecifications = (labels[sidc] || []).flatMap(evalTextField)
  return { labelSpecifications, styleSpecification }
}, ['parameterizedSIDC', 'evalTextField']])


/**
 * placement
 */
rules.push([next => {
  return { placement: placement(next) }
}, ['geometry']])


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
