import shared from '../shared'
import generic from '../generic'
import styles from './styles'
import labels from './labels'
import placement from './placement'

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
 * simplified, simplifiedGeometry
 */
rules.push([next => {
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
  const { geometry } = next
  return { placement: placement(geometry) }
}, ['geometry']])

export default rules
