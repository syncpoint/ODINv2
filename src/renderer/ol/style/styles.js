import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import * as Geometry from '../../model/geometry'
import styleRegistry from './styleRegistry'
import point from './point'
import polygon from './polygon'
import defaultStyle from './defaultStyle'
import isEqual from 'react-fast-compare'
import keyequals from './keyequals'

import colorScheme from './_colorScheme'
import schemeStyle from './_schemeStyle'
import effectiveStyle from './_effectiveStyle'

export default feature => {
  const { $ } = feature

  $.properties = $.feature.map(feature => feature.getProperties())
  $.properties.equals = isEqual

  $.geometry = $.feature.map(feature => feature.getGeometry())
  $.geometry.equals = keyequals() // currently no other way to set equals for map

  $.sidc = $.properties.map(R.prop('sidc'))
  $.colorScheme = Signal.link(colorScheme, [$.globalStyle, $.layerStyle, $.featureStyle])
  $.schemeStyle = Signal.link(schemeStyle, [$.sidc, $.colorScheme])
  $.effectiveStyle = Signal.link(effectiveStyle, [$.globalStyle, $.schemeStyle, $.layerStyle, $.featureStyle])
  $.styleRegistry = $.effectiveStyle.map(styleRegistry)

  const geometryType = Geometry.geometryType(feature.getGeometry())
  if (geometryType === 'Point') return point($)
  else if (geometryType === 'Polygon') return polygon($)
  else return Signal.of(defaultStyle())
}
