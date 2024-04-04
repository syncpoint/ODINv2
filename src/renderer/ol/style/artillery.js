import * as R from 'ramda'
import * as shared from './shared'
import dynamicStyles from './artillery-styles'
import { transform } from '../../model/geometry'

/**
 * dynamicStyle
 * staticStyles
 */
const collectStyles = [next => {
  const { parameterizedSIDC: sidc } = next
  const dynamicStyle = (dynamicStyles[sidc] || dynamicStyles.DEFAULT)
  return { dynamicStyle }
}, ['parameterizedSIDC']]

const styles = [next => {
  const { dynamicStyle } = next
  const styles = dynamicStyle(next)
  return { styles }
}, ['dynamicStyle', 'geometry']]


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
  const resolution = pointResolution(centerResolution)
  const rewrite = ({ geometry, ...props }) => ({ geometry: write(geometry), ...props })
  return { geometry, rewrite, resolution }
}, ['mode', 'geometryKey', 'centerResolution']]

/**
 * selectedStyles
 */
const selectedStyles = [next => {
  const { TS, mode, geometry } = next

  const selectedStyles = []
  const points = R.take(2, TS.geometries(geometry)).flatMap(TS.points)

  const handles = mode !== 'default'
    ? mode === 'singleselect'
      ? { id: 'style:circle-handle', geometry: TS.multiPoint(points) }
      : { id: 'style:rectangle-handle', geometry: points()[0] }
    : null

  handles && selectedStyles.push(handles)
  return { selectedStyles }
}, ['mode', 'geometry']]

export default [
  shared.sidc,
  geometry,
  collectStyles,
  shared.effectiveStyle,
  selectedStyles,
  styles,
  shared.style
]
