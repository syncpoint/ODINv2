import { styles } from './styles'
import { symbolStyle } from './symbol-style'

styles.Point = ({ feature }) => {
  // TODO: e872d67c-7528-4ff6-9bee-b792b2a2fd7e - preferences/project: show/hide labels
  const modifiers = true
  return symbolStyle(feature, { modifiers })
}
