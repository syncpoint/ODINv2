import { Jexl } from 'jexl'
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, statusCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'
import { styleFactory } from './styleFactory'

const jexl = new Jexl()
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


/**
 * evalTextField
 */
export const evalTextField = [next => {
  const { modifiers } = next
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, modifiers)

  const evalTextField = specs => {
    if (!Array.isArray(specs)) return evalTextField([specs])
    return specs.reduce((acc, spec) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSync(spec['text-field'])
        if (textField) acc.push({ ...spec, 'text-field': textField })
      }

      return acc
    }, [])
  }

  return { evalTextField }
}, ['modifiers']]


/**
 * effectiveStyle :: {k, v}
 * smoothen :: boolean
 * styleFactory :: [props] -> [ol/style/Style]
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
  const { 'line-smooth': smoothen, ...effectiveStyle } = merged

  return {
    smoothen: !!smoothen,
    effectiveStyle,
    styleFactory: styleFactory(effectiveStyle),
    rewrite: null
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
  const { dynamicStyle, staticStyles, rewrite, evalTextField, placement } = next
  const styles = [
    ...dynamicStyle(next),
    ...staticStyles
  ]
    .flatMap(evalTextField)
    .flatMap(placement)
    .map(rewrite)

  return { styles }
}, ['rewrite', 'dynamicStyle', 'staticStyles', 'evalTextField', 'placement']]


/**
 * style :: [ol/style/Style]
 */
export const style = [next => {
  const { styles, styleFactory } = next
  const style = styles.flatMap(styleFactory)
  return { style }
}, ['styles', 'styleFactory']]