import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import * as Geometry from '../../model/geometry'
import styleRegistry from './styleRegistry'
import point from './point'
import polygon from './polygon'
import linestring from './linestring'
import fallback from './fallback'
import isEqual from 'react-fast-compare'
import keyequals from './keyequals'
import transform from './_transform'
import { styleFactory } from './styleFactory'

import _colorScheme from './_colorScheme'
import _schemeStyle from './_schemeStyle'
import _effectiveStyle from './_effectiveStyle'
import _rewrite from './_rewrite'

export default feature => {
  const { $ } = feature

  $.properties = $.feature.map(feature => feature.getProperties())
  $.properties.equals = isEqual
  $.geometry = $.feature.map(feature => feature.getGeometry())
  $.geometry.equals = keyequals() // currently no other way to set equals for map
  $.geometryType = $.geometry.map(Geometry.geometryType)

  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.rewrite = write.map(fn => xs => xs.map(_rewrite(fn)))
  $.pointResolution = pointResolution
  $.sidc = $.properties.map(R.prop('sidc'))
  $.colorScheme = Signal.link(_colorScheme, [$.globalStyle, $.layerStyle, $.featureStyle])
  $.schemeStyle = Signal.link(_schemeStyle, [$.sidc, $.colorScheme])
  $.effectiveStyle = Signal.link(_effectiveStyle, [$.globalStyle, $.schemeStyle, $.layerStyle, $.featureStyle])
  $.styleRegistry = $.effectiveStyle.map(styleRegistry)
  $.styleRegistryX = $.styleRegistry.map(fn => xs => xs.map(fn))
  $.styleFactory = Signal.of(xs => xs.flatMap(styleFactory))

  const geometryType = Geometry.geometryType(feature.getGeometry())
  if (geometryType === 'Point') point($)
  else if (geometryType === 'Polygon') polygon($)
  else if (geometryType === 'LineString') linestring($)
  else fallback($)

  return Signal.link((...styles) => styles.reduce(R.concat), [$.labels, $.shape, $.selection])
    .ap($.styleRegistryX)
    .ap($.rewrite)
    .ap($.styleFactory)
}
