import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import Polygon from './__Polygon'
import LineString from './__LineString'
import Point from './__Point'
import { style as defaultStyle } from './__style'
import { parameterized } from '../../symbology/2525c'
import * as Geometry from '../../model/geometry'
import styleRegistry from './styleRegistry'
import { styleFactory } from './styleFactory'

import symbolModifiers from './_symbolModifers'
import colorScheme from './_colorScheme'
import schemeStyle from './_schemeStyle'
import effectiveStyle from './_effectiveStyle'
import smoothenedGeometry from './_smoothenedGeometry'
import transform from './_transform'
import evalSync from './_evalSync'
import labelStyles from './_labelStyles'

const other = {
  simplifyGeometry: R.identity,
  smoothenGeometry: R.identity,
  labels: R.always([]),
  labelPlacement: R.always(R.identity),
  mainStyles: R.always(Signal.of([])),
  style: R.always(Signal.of(defaultStyle()))
}

const HOOKS = {
  Polygon,
  LineString,
  Point,
  other
}

export const style = feature => {
  const geometryType = Geometry.geometryType(feature.getGeometry())
  const hooks = HOOKS[geometryType] ?? HOOKS.other
  const { $ } = feature

  // definingGeometry :: ol/geom/Geometry - original feature geometry as stored in database
  // properties :: { k: v } - feature properties incl. SIDC
  // * modifiers :: { k: v } - feature properties excl. SIDC
  // sidc :: String
  // parameterizedSIDC :: String - normalized/parameterized SIDC
  // symbolModifiers :: { k: v } - 2525C text modifiers
  // labels :: [StyleDefinition] || []
  // colorScheme :: String - 'light' | 'medium' | 'dark'
  // schemeStyle :: StyleDefinition - symbol style presets based on status and identity
  // effectiveStyle :: StyleDefinition - merged style definitions
  // lineSmoothing :: Boolean
  // styleRegistry :: StyleDefinition -> StyleDefinition - parameterized style lookup/translation
  // olSimplifiedGeometry :: ol/geom/Geometry - LineString/Polygon only, definingGeometry else
  // olSmoothenedGeometry :: ol/geom/Geometry
  // transform :: { read, write, pointResolution} - WGS84/UTM projection

  $.definingGeometry = $.feature.map(feature => feature.getGeometry())
  $.properties = $.feature.map(feature => feature.getProperties())
  $.modifiers = $.properties.map(({ sidc, ...modifiers }) => modifiers)
  $.sidc = $.properties.map(R.prop('sidc'))
  $.evalSync = Signal.link(evalSync, [$.sidc, $.modifiers])
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.symbolModifiers = Signal.link(symbolModifiers, [$.properties])
  $.labels = $.parameterizedSIDC.map(hooks.labels).map(xs => xs.flat())
  $.colorScheme = Signal.link(colorScheme, [$.globalStyle, $.layerStyle, $.featureStyle])
  $.schemeStyle = Signal.link(schemeStyle, [$.sidc, $.colorScheme])
  $.effectiveStyle = Signal.link(effectiveStyle, [$.globalStyle, $.schemeStyle, $.layerStyle, $.featureStyle])
  $.lineSmoothing = $.effectiveStyle.map(style => style['line-smooth'] || false)
  $.styleRegistry = $.effectiveStyle.map(styleRegistry)
  $.olSimplifiedGeometry = Signal.link(hooks.simplifyGeometry, [$.definingGeometry, $.centerResolution])
  $.olSmoothenedGeometry = Signal.link(smoothenedGeometry(hooks), [$.olSimplifiedGeometry, $.lineSmoothing])

  const [read, write, pointResolution] = transform($.olSmoothenedGeometry)
  $.read = read
  $.write = write

  $.resolution = $.centerResolution.ap(pointResolution)
  $.jtsSimplifiedGeometry = $.olSimplifiedGeometry.ap(read)
  $.geometry = $.olSmoothenedGeometry.ap(read)
  $.labelPlacement = $.geometry.map(hooks.labelPlacement)
  $.mainStyles = hooks.mainStyles($)
  $.labelStyles = Signal.link(labelStyles, [$.labels, $.labelPlacement])
  $.allStyles = Signal.link((mainStyles, labelStyles, ) => mainStyles.concat(labelStyles), [$.mainStyles, $.labelStyles])

  return Signal.link((styles, evalSync, write, styleRegistry) => {
    return styles
      .map(styleRegistry)
      .flatMap(evalSync)
      .map(({ geometry, ...rest }) => ({ geometry: write(geometry), ...rest }))
      .flatMap(styleFactory)

  }, [$.allStyles, $.evalSync, $.write, $.styleRegistry])
}
