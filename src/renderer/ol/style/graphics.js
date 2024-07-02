import Signal from '@syncpoint/signal'
import transform from './_transform'

export default (geometryType, $) => {
  console.log('geometryType', geometryType)

  $.resolution = Signal.of()
  const [read, write, pointResolution] = transform($.geometry)

  $.read = read
  $.write = write
  $.pointResolution = $.resolution.ap(pointResolution)

  $.pointResolution.on(console.log)

  return Signal.of(null)
}
