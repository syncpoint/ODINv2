import Signal from '@syncpoint/signal'
import defaultStyle from './defaultStyle'

export default $ => {

  // ==> Mandatory slots to fill to derive resulting style:

  $.labels = Signal.of([])
  $.selection = Signal.of([])
  $.shape = Signal.of([defaultStyle()])

  // <== Mandatory slots
}
