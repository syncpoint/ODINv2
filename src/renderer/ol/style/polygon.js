/* eslint-disable camelcase */
import * as shared from './shared'
import styles from './polygon-styles'
import { placement } from './polygon-placement'
import { labels } from './polygon-styles/labels'

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
 * placement
 */
const labelPlacement = [next => {
  return { placement: placement(next) }
}, ['geometry']]


/**
 * style :: [ol/style/Style]
 */
const error = [next => {
  return { styles: styles.ERROR(next) }
}, ['err']]

export default [
  shared.sidc,
  shared.evalSync,
  collectStyles,
  shared.effectiveStyle,
  shared.geometry,
  labelPlacement,
  shared.selectedStyles,
  shared.styles,
  error,
  shared.style
]
