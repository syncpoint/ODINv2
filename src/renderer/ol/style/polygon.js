import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import * as TS from '../ts'
import * as Math from '../../../shared/Math'
import transform from './_transform'
import { parameterized } from '../../symbology/2525c'
import labels from './polygon-styles/labels'
import styles from './polygon-styles/index'
import placement from './polygon-styles/placement'
import evalSync from './_evalSync'
import smoothenedGeometry from './_smoothenedGeometry'
import { styleFactory } from './styleFactory'

const { link } = Signal

const _context = (geometry, resolution) => ({ TS, ...Math, geometry, resolution})
const _labels = sidc => (labels[sidc] || []).flat()
const _shape = sidc => styles[sidc] || styles.DEFAULT
const lineSmoothing = style => style['line-smooth'] || false
const simplifiedGeometry = (geometry, resolution) => {
  const coordinates = geometry.getCoordinates()
  return coordinates[0].length > 50
    ? geometry.simplify(resolution)
    : geometry
}

export default $ => {
  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.write = write
  $.pointResolution = $.resolution.ap(pointResolution)
  // $.utmGeometry = $.geometry.ap($.read)
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.evalSync = link(evalSync, [$.sidc, $.properties])
  $.simplifiedGeometry = link(simplifiedGeometry, [$.geometry, $.resolution])
  $.lineSmoothing = $.effectiveStyle.map(lineSmoothing)
  $.smoothenedGeometry = link(smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])
  $.utmSmoothenedGeometry = $.smoothenedGeometry.ap($.read)
  $.context = link(_context, [$.utmSmoothenedGeometry, $.pointResolution])
  $.shape = $.context.ap($.parameterizedSIDC.map(_shape))
  $.placement = $.utmSmoothenedGeometry.map(placement)
  $.labels = $.parameterizedSIDC
    .map(_labels)
    .ap($.evalSync)
    .ap($.placement)

  $.styles = link((...styles) => styles.reduce(R.concat), [$.labels, $.shape])

  return link((styles, styleRegistry, write) => {
    return styles
      .map(styleRegistry)
      .map(({ geometry, ...rest }) => ({ geometry: write(geometry), ...rest }))
      .flatMap(styleFactory)
  }, [$.styles, $.styleRegistry, $.write, $.evalSync])
}
