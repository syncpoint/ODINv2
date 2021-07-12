import { symbolStyle } from './symbol-style'

const styles = {}

styles['Point:highest'] = ({ cache, feature }) => {
  const key = `POINT:${feature.getId()}:${feature.getRevision()}`
  return cache.entry(key, () => symbolStyle(feature, { modifiers: true }))
}

styles['Point:high'] = styles['Point:highest']

styles['Point:medium'] = ({ cache, feature }) => {
  const key = `POINT:${feature.get('sidc')}`
  return cache.entry(key, () => symbolStyle(feature, { modifiers: false }))
}

styles['Point:low'] = styles['Point:medium']

export default styles
