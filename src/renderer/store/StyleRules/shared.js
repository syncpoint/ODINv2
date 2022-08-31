import * as Colors from '../../ol/style/color-schemes'
import { identityCode, statusCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'
import { styleFactory } from './styleFactory'
import * as Labels from './labels'
import makeEffectiveStyle from './effectiveStyle'

const rules = []
export default rules


/**
 * sidc :: String
 * parameterizedSIDC :: String
 * modifiers :: [String]
 */
export const sidc = [next => {
  const { properties } = next
  const { sidc, ...modifiers } = properties
  const parameterizedSIDC = parameterized(sidc)
  return { sidc, parameterizedSIDC, modifiers }
}, ['properties']]


export const evalSync = [next => {
  const { modifiers } = next
  return { evalSync: Labels.evalSync(modifiers) }
}, ['modifiers']]


/**
 * effectiveStyle :: ...
 * smoothen :: boolean
 */
export const effectiveStyle = [next => {
  const global = next.globalStyle || {}
  const layer = next.layerStyle || {}
  const feature = next.featureStyle || {}
  const { sidc } = next
  const status = statusCode(sidc)
  const identity = identityCode(sidc)
  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  const colorScheme = feature?.['color-scheme'] ||
    layer?.['color-scheme'] ||
    global?.['color-scheme'] ||
    'medium'

  const scheme = {
    'binary-color': Colors.lineColor(colorScheme)(simpleIdentity), // black or red
    'line-color': Colors.lineColor(colorScheme)(identity),
    'fill-color': Colors.lineColor(colorScheme)(identity),
    'line-dash-array': status === 'A' ? [20, 10] : null,
    'line-halo-color': Colors.lineHaloColor(identity),
    'line-halo-dash-array': status === 'A' ? [20, 10] : null
  }

  // Split `smoothen` from rest.
  // We don't want to calculate new geometries on color change.
  const merged = { ...global, ...layer, ...scheme, ...feature }
  const { 'line-smooth': smoothen, ...props } = merged

  return {
    smoothen: !!smoothen,
    effectiveStyle: makeEffectiveStyle(next, props)
  }
}, ['sidc', 'globalStyle', 'layerStyle', 'featureStyle']]


/**
 * geometry :: jsts/geom/geometry
 * rewrite :: ...
 * resolution :: Number
 */
export const geometry = [next => {
  const { mode, smoothen, definingGeometry, centerResolution } = next

  // Simplify.
  // Never simplify current selection.
  const overweight = geometry =>
    (geometry.getType() === 'Polygon' && geometry.getCoordinates()[0].length > 50) ||
    (geometry.getType() === 'LineString' && geometry.getCoordinates().length > 50)

  const simplified = mode !== 'singleselect' && overweight(definingGeometry)
  const simplifiedGeometry = simplified
    ? definingGeometry.simplify(centerResolution)
    : definingGeometry

  // Smoothen.
  //
  const smoothenedGeometry = smoothen
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  // Transform (TS/UTM).
  //
  const { read, write, pointResolution } = transform(smoothenedGeometry)
  const geometry = read(smoothenedGeometry)
  const resolution = pointResolution(centerResolution)
  const rewrite = ({ geometry, ...props }) => ({ geometry: write(geometry), ...props })

  return {
    geometry,
    rewrite,
    resolution
  }
}, ['mode', 'smoothen', 'geometryKey', 'centerResolution']]


/**
 * styles :: ...
 */
export const styles = [next => {
  const { dynamicStyle, staticStyles, evalSync, placement } = next
  const styles = [
    ...dynamicStyle(next),
    ...staticStyles
  ]
    .flatMap(evalSync)
    .flatMap(placement)

  return { styles }
}, ['dynamicStyle', 'staticStyles', 'evalSync', 'placement']]


/**
 * style :: [ol/style/Style]
 */
export const style = [next => {
  const { TS, styles, effectiveStyle, rewrite } = next
  if (styles.length === 0) return { style: [] }
  const effectiveStyles = styles.map(effectiveStyle)

  const bboxes = effectiveStyles.map(Labels.boundingBox(next)).filter(Boolean)
  const clipLine = effectiveStyles.some(props => props['text-clipping'] === 'line')
  const lineString = geometry => TS.lineString(geometry.getCoordinates())
  const clip = geometry => TS.difference([geometry, ...bboxes])
  const geometry = clipLine
    ? lineString(effectiveStyles[0].geometry)
    : effectiveStyles[0].geometry

  // Replace primary geometry with clipped geometry:
  effectiveStyles[0].geometry = clip(geometry)

  const style = effectiveStyles
    .map(rewrite)
    .flatMap(styleFactory)

  return { style }
}, ['styles', 'effectiveStyle']]
