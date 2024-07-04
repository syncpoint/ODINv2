import Signal from '@syncpoint/signal'
import transform from './_transform'
import graphicsStatic from './graphicsStatic'
import graphicsDynamic from './graphicsDynamic'
import { parameterized } from '../../symbology/2525c'

import labels from './_labels'
import evalSync from './_evalSync'
import placement from './_placement'

export default (geometryType, $) => {
  $.resolution = Signal.of()
  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.write = write
  $.pointResolution = $.resolution.ap(pointResolution)
  $.utmGeometry = $.geometry.ap($.read)
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.labels = Signal.link(labels, [$.geometryType, $.parameterizedSIDC])
  $.evalSync = Signal.link(evalSync, [$.sidc, $.properties])

  $.resolution.on(console.log)

  const style = (['LineString', 'Polygon'].includes(geometryType))
    ? graphicsDynamic($)
    : graphicsStatic($)

  $.placement = placement($)
  // $.placement.on(console.log)


  return style
}
