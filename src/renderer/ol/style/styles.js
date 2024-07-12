import * as R from 'ramda'
import { parameterized } from '../../symbology/2525c'
import Signal from '@syncpoint/signal'
import * as Geometry from '../../model/geometry'
import styleRegistry from './styleRegistry'
import symbol from './symbol'
import polygon from './polygon'
import linestring from './linestring'
import multipoint from './multipoint'
import corridor from './corridor'
import marker from './marker'
import fallback from './fallback'
import transform from './_transform'
import { styleFactory } from './styleFactory'
import * as ID from '../../ids'

import _colorScheme from './_colorScheme'
import _schemeStyle from './_schemeStyle'
import _effectiveStyle from './_effectiveStyle'
import _rewrite from './_rewrite'
import _evalSync from './_evalSync'
import _clip from './_clip'

export default feature => {
  const { $ } = feature

  $.sidc = $.properties.map(R.prop('sidc'))
  $.parameterizedSIDC = $.sidc.map(parameterized)

  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.rewrite = write.map(fn => xs => xs.map(_rewrite(fn)))
  $.pointResolution = pointResolution
  $.resolution = $.centerResolution.ap($.pointResolution)
  $.clip = $.resolution.map(_clip)

  $.evalSync = Signal.link(_evalSync, [$.sidc, $.properties])
  $.colorScheme = Signal.link(_colorScheme, [$.globalStyle, $.layerStyle, $.featureStyle])
  $.schemeStyle = Signal.link(_schemeStyle, [$.sidc, $.colorScheme])
  $.effectiveStyle = Signal.link(_effectiveStyle, [$.globalStyle, $.schemeStyle, $.layerStyle, $.featureStyle])
  $.styleRegistry = $.effectiveStyle
    .map(styleRegistry)
    .map(fn => xs => xs.map(fn))
  $.styleFactory = Signal.of(xs => xs.flatMap(styleFactory))

  const featureId = feature.getId()
  const geometryType = Geometry.geometryType(feature.getGeometry())

  if (ID.isMarkerId(featureId)) return marker($)
  // else if (ID.isMeasureId(featureId)) console.log('MEASURE')
  else if (geometryType === 'Point') return symbol($)
  else if (geometryType === 'Polygon') return polygon($)
  else if (geometryType === 'LineString') return linestring($)
  else if (geometryType === 'MultiPoint') return multipoint($)
  else if (geometryType === 'LineString:Point') return corridor($)
  else return fallback($)
}
