import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'

const rules = [] // LineString, Polygon

/**
 *
 */
rules.push([() => {
  return {
    smoothenedGeometry: null,
    geometry: null,
    labelPlacements: null,
    calculatedStyles: null,
    labelStyles: null,
    style: null
  }
}, ['geometryKey']])


/**
 * smoothenedGeometry
 */
rules.push([next => {
  const { simplifiedGeometry, smoothen } = next
  const smoothenedGeometry = smoothen
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  return {
    smoothenedGeometry,
    geometry: null,
    calculatedStyles: null,
    labelStyles: null
  }
}, ['smoothen', 'geometryKey', 'simplifiedGeometry']])


/**
 * read, write, resolution, geometry
 */
rules.push([next => {
  const { smoothenedGeometry, centerResolution } = next
  const { read, write, pointResolution } = transform(smoothenedGeometry)
  const geometry = read(smoothenedGeometry)
  const resolution = pointResolution(centerResolution)
  return { read, write, resolution, geometry }
}, ['geometryKey', 'smoothenedGeometry', 'centerResolution']])


/**
 * calculatedStyles :: [ol/style/Style]
 */
rules.push([next => {
  const { styleFactory, styleSpecification, write } = next
  const calculatedStyles = styleSpecification(next)
    .map(({ geometry, ...props }) => ({ geometry: write(geometry), ...props }))
    .flatMap(styleFactory)

  return { calculatedStyles }
}, ['geometry', 'styleFactory', 'styleSpecification']])


/**
 * labelPlacements
 */
rules.push([next => {
  const { labelSpecifications, placement } = next
  const labelPlacements = labelSpecifications.flatMap(spec => placement(spec))
  return { labelPlacements }
}, ['placement', 'labelSpecifications']])


/**
 * labelStyles :: [ol/style/Style]
 */
rules.push([next => {
  const { labelPlacements, styleFactory, write } = next
  const labelStyles = labelPlacements
    .map(({ geometry, options }) => ({ geometry: write(geometry), ...options }))
    .flatMap(styleFactory)

  return { labelStyles }
}, ['labelPlacements', 'styleFactory']])


/**
 * style :: [ol/style/Style]
 */
rules.push([next => {
  const style = [
    ...next.calculatedStyles,
    ...next.labelStyles
  ]

  return { style }
}, ['calculatedStyles', 'labelStyles']])

export default rules
