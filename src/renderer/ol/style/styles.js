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
import measure from './measure'
import fallback from './fallback'
import { styleFactory } from './styleFactory'
import * as ID from '../../ids'

import _colorScheme from './_colorScheme'
import _schemeStyle from './_schemeStyle'
import _effectiveStyle from './_effectiveStyle'

export default feature => {
  const { $ } = feature

  // IMPORTANT: Use propOr(null) instead of prop() here.
  // Features without an SIDC (e.g. custom SVG icons pushed via NIDO API)
  // would yield undefined for $.sidc. The @syncpoint/signal library treats
  // undefined as "no value" — a derived signal (Signal.link / .ap) will
  // NOT compute its initial value when ANY source signal is undefined.
  // This would poison the entire downstream chain:
  //   $.sidc (undefined) -> $.schemeStyle -> $.effectiveStyle -> $.styleRegistry
  // causing .ap($.styleRegistry) to never emit, so OpenLayers never
  // receives a style and falls back to its default blue circle.
  // Using null instead of undefined keeps the signal chain alive while
  // still being falsy for the SIDC-based code paths (identityCode,
  // statusCode, parameterized all handle null/falsy gracefully).
  $.sidc = $.properties.map(R.propOr(null, 'sidc'))
  $.parameterizedSIDC = $.sidc.map(parameterized)
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
  else if (ID.isMeasureId(featureId)) return measure($)
  else if (geometryType === 'Point') return symbol($)
  else if (geometryType === 'Polygon') return polygon($)
  else if (geometryType === 'LineString') return linestring($)
  else if (geometryType === 'MultiPoint') return multipoint($)
  else if (geometryType === 'LineString:Point') return corridor($)
  else return fallback($)
}
