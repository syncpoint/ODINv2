/* eslint-disable camelcase */
import { rules } from '../rules'
import STYLES from './styles'
import LABELS from './labels'
import placement from './placement'

rules.Polygon = [
  ...rules.shared,
  ...rules.generic
]

/**
 *
 */
rules.Polygon.push([() => {
  return { placement: null }
}, ['geometryKey']])


/**
 * simplified, geometry_simplified
 */
rules.Polygon.push([next => {
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
rules.Polygon.push([next => {
  const { parameterizedSIDC: sidc, evalTextField } = next
  const styleSpecification = (STYLES[sidc] || STYLES.DEFAULT)
  const labelSpecifications = (LABELS[sidc] || []).flatMap(evalTextField)
  return { labelSpecifications, styleSpecification }
}, ['parameterizedSIDC', 'evalTextField']])


/**
 * placement
 */
rules.Polygon.push([next => {
  const { geometry } = next
  return { placement: placement(geometry) }
}, ['geometry']])
