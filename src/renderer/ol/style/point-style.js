import { symbolStyle } from './symbol-style'

const styles = {}

styles.Point = ({ cache, feature }) => {
  // TODO: e872d67c-7528-4ff6-9bee-b792b2a2fd7e - preferences/project: show/hide labels
  const modifiers = true
  const key = `POINT:${feature.getId()}:${modifiers}:${feature.getRevision()}`
  return cache.entry(key, () => symbolStyle(feature, { modifiers }))
}

export default styles
