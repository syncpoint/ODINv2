import { rules } from '../rules'
import styles from './styles'
import labels from './labels'
import placement from './placement'

rules.LineString = [
  ...rules.shared,
  ...rules.generic
]

/**
 *
 */
rules.LineString.push([() => {
  return { placement: null }
}, ['geometryKey']])


/**
 * simplified, simplifiedGeometry
 */
rules.LineString.push([next => {
  const { definingGeometry, centerResolution, mode } = next

  // Never simplify current selection.
  const simplified = mode === 'singleselect'
    ? false
    : definingGeometry.getCoordinates().length > 50

  const simplifiedGeometry = simplified
    ? definingGeometry.simplify(centerResolution)
    : definingGeometry

  return {
    simplified,
    simplifiedGeometry
  }
}, ['centerResolution', 'mode', 'geometryKey', 'definingGeometry']])


/**
 * labelSpecifications, styleSpecifications
 */
rules.LineString.push([next => {
  const { parameterizedSIDC: sidc, evalTextField } = next
  const styleSpecification = (styles[sidc] || styles.DEFAULT)
  const labelSpecifications = (labels[sidc] || []).flatMap(evalTextField)
  return { labelSpecifications, styleSpecification }
}, ['parameterizedSIDC', 'evalTextField']])


/**
 * placement
 */
rules.LineString.push([next => {
  const { geometry } = next
  return { placement: placement(geometry) }
}, ['geometry']])
