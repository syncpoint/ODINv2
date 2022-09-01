import * as Colors from '../../ol/style/color-schemes'
import { identityCode, statusCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'
import { styleFactory } from './styleFactory'
import * as Labels from './labels'
import styleRegistry from './styleRegistry'

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
    effectiveStyle: styleRegistry(next, props)
  }
}, ['sidc', 'globalStyle', 'layerStyle', 'featureStyle']]


/**
 * geometry :: jsts/geom/geometry
 * rewrite :: ...
 * resolution :: Number
 */
export const geometry = [next => {
  const { smoothen, definingGeometry, centerResolution, geometryType } = next

  // Simplify.
  // Never simplify current selection.
  const coordinates = definingGeometry.getCoordinates()
  const simplified =
    (geometryType === 'Polygon' && coordinates[0].length > 50) ||
    (geometryType === 'LineString' && coordinates.length > 50)

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
    simplified,
    geometry,
    simplifiedGeometry: read(simplifiedGeometry),
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
 *
 */
export const selectedStyles = [next => {
  const { TS, mode, simplifiedGeometry, geometryType } = next
  const selectedStyles = []

  const guideline = mode === 'singleselect'
    ? { id: 'style:guide-stroke', geometry: simplifiedGeometry }
    : null

  const points = () => TS.points(simplifiedGeometry)
  const handles = geometryType !== 'point' && mode !== 'default'
    ? mode === 'singleselect'
      ? { id: 'style:circle-handle', geometry: TS.multiPoint(points()) }
      : { id: 'style:rectangle-handle', geometry: points()[0] }
    : null

  guideline && selectedStyles.push(guideline)
  handles && selectedStyles.push(handles)

  return { selectedStyles }
}, ['mode', 'simplifiedGeometry']]


/**
 * style :: [ol/style/Style]
 */
export const style = [next => {
  const { TS, styles, selectedStyles, effectiveStyle, rewrite } = next
  if (styles.length === 0) return { style: [] }
  const effectiveStyles = [...styles, ...selectedStyles].map(effectiveStyle)

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
}, ['styles', 'effectiveStyle', 'selectedStyles']]
