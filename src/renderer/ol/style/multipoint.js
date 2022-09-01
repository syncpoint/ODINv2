/* eslint-disable no-multi-spaces */
/* eslint-disable camelcase */

import * as shared from './shared'
import styles from './multipoint-styles'
import { transform } from '../../model/geometry'
import { placement } from './polygon'

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



// => label specifications for circular features with polygon placement

const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-clipping': 'none', ...options }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

const labels = {
  'G*F*ATC---': C(ALL_LINES()),                // CIRCULAR TARGET
  'G*F*ACSC--': C(ALL_LINES('FSA')),           // FIRE SUPPORT AREA (FSA) CIRCULAR
  'G*F*ACAC--': C(ALL_LINES('ACA')),           // AIRSPACE COORDINATION AREA (ACA) CIRCULAR
  'G*F*ACFC--': C(ALL_LINES('FFA')),           // FREE FIRE AREA (FFA) CIRCULAR
  'G*F*ACNC--': C(ALL_LINES('NFA'), HALO),     // NO-FIRE AREA (NFA) CIRCULAR
  'G*F*ACRC--': C(ALL_LINES('RFA')),           // RESTRICTIVE FIRE AREA (RFA) CIRCULAR
  'G*F*ACPC--': B('"PAA"'),                    // POSITION AREA FOR ARTILLERY (PAA) CIRCULAR
  'G*F*ACEC--': C(ALL_LINES('SENSOR ZONE')),   // SENSOR ZONE CIRCULAR
  'G*F*ACDC--': C(ALL_LINES('DA')),            // DEAD SPACE AREA (DA) CIRCULAR
  'G*F*ACZC--': C(ALL_LINES('ZOR')),           // ZONE OF RESPONSIBILITY (ZOR) CIRCULAR
  'G*F*ACBC--': C(ALL_LINES('TBA')),           // TARGET BUILD-UP AREA (TBA) CIRCULAR
  'G*F*ACVC--': C(ALL_LINES('TVAR')),          // TARGET VALUE AREA (TVAR) CIRCULAR
  'G*F*AKBC--': C(ALL_LINES('BKB'), HALO),     // KILL BOX BLUE CIRCULAR
  'G*F*AKPC--': C(ALL_LINES('PKB'), HALO)      // KILL BOX PURPLE CIRCULAR
}
