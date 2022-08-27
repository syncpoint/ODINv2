import { Jexl } from 'jexl'
import { rules } from './rules'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'

const jexl = new Jexl()

rules.generic = [] // LineString, Polygon


/**
 *
 */
rules.generic.push([() => {
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
 * evalTextField
 */
rules.generic.push([next => {
  const { properties } = next
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

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
}, ['properties']])


/**
 * smoothenedGeometry
 */
rules.generic.push([next => {
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
rules.generic.push([next => {
  const { smoothenedGeometry, centerResolution } = next
  const { read, write, pointResolution } = transform(smoothenedGeometry)
  const geometry = read(smoothenedGeometry)
  const resolution = pointResolution(centerResolution)
  return { read, write, resolution, geometry }
}, ['geometryKey', 'smoothenedGeometry', 'centerResolution']])


/**
 * calculatedStyles :: [ol/style/Style]
 */
rules.generic.push([next => {
  const { styleFactory, styleSpecification, write } = next
  const calculatedStyles = styleSpecification(next)
    .map(({ geometry, ...props }) => ({ geometry: write(geometry), ...props }))
    .flatMap(styleFactory)

  return { calculatedStyles }
}, ['geometry', 'styleFactory', 'styleSpecification']])


/**
 * labelPlacements
 */
rules.generic.push([next => {
  const { labelSpecifications, placement } = next
  const labelPlacements = labelSpecifications.flatMap(spec => placement(spec))
  return { labelPlacements }
}, ['placement', 'labelSpecifications']])


/**
 * labelStyles :: [ol/style/Style]
 */
rules.generic.push([next => {
  const { labelPlacements, styleFactory, write } = next
  const labelStyles = labelPlacements
    .map(({ geometry, options }) => ({ geometry: write(geometry), ...options }))
    .flatMap(styleFactory)

  return { labelStyles }
}, ['labelPlacements', 'styleFactory']])


/**
 * style :: [ol/style/Style]
 */
rules.generic.push([next => {
  const style = [
    ...next.calculatedStyles,
    ...next.labelStyles
  ]

  return { style }
}, ['calculatedStyles', 'labelStyles']])
