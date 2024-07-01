import Signal from '@syncpoint/signal'

export default $ => {

  $.resolution = Signal.of()

  return Signal.of(null)
}