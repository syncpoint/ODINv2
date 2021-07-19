import { symbolStyle } from './symbol-style'

const styles = {}

styles.Point = ({ cache, feature }) => {
  const modifiers = true // TODO: settings
  const key = `POINT:${feature.getId()}:${modifiers}:${feature.getRevision()}`
  return cache.entry(key, () => symbolStyle(feature, { modifiers }))
}

export default styles
