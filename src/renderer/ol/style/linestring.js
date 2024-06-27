import * as shared from './shared'
import styles from './linestring-styles'
import { placement } from './linestring-placement'
import { labels } from './linestring-styles/labels'

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


export default [
  shared.sidc,
  shared.evalSync,
  collectStyles,
  shared.effectiveStyle,
  shared.geometry,
  labelPlacement,
  shared.selectedStyles,
  shared.styles,
  shared.style
]


// ==> label specifications and placement



