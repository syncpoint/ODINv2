import Signal from '@syncpoint/signal'
import defaultStyle from './defaultStyle'

export default $ => {
  return Signal.of(defaultStyle({ strokeColor: 'red' }))
}
