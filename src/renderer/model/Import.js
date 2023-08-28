import * as R from 'ramda'
import * as ID from '../ids'

export const clone = async (defaultLayerId, unsorted) => {
  const entries = unsorted.sort(([a], [b]) => ID.ord(a) - ID.ord(b))
  const entrymap = Object.fromEntries(entries)

  // Collect all features which are not included in a layer
  // which itself is also part of selection.
  // These (uncovered) features will be assigned to default layer.

  const uncoveredIds = entries.reduce((acc, [key]) => {
    if (!ID.isFeatureId(key)) return acc
    if (entrymap[ID.layerId(key)]) return acc
    acc.push(key)
    return acc
  }, [])

  // Create default layer if necessary.

  const tuples = []
  if (uncoveredIds.length && !defaultLayerId) {
    defaultLayerId = ID.layerId()
    tuples.push([defaultLayerId, { name: 'Default Layer' }])
    tuples.push([ID.defaultId(defaultLayerId), ['default']])
  }

  // All (uncovered) features where layer is not explicitly included
  // in selection are assigned to default layer.

  const keymap = uncoveredIds.reduce((acc, featureId) => {
    // Map old (uncovered) layer to default layer:
    acc[ID.layerId(featureId)] = defaultLayerId
    return acc
  }, {})


  // Add new replacement to keymap (old key -> new key):
  const replace = key => R.tap(replacement => (keymap[key] = replacement))

  const rewrite = R.cond([
    [ID.isLayerId, key => replace(key)(ID.layerId())],
    [ID.isFeatureId, key => replace(key)(ID.featureId(keymap[ID.layerId(key)]))],
    [ID.isLinkId, key => replace(key)(ID.linkId(keymap[ID.containerId(key)]))],
    [ID.isTagsId, key => replace(key)(ID.tagsId(keymap[ID.associatedId(key)]))],
    [ID.isMarkerId, key => replace(key)(ID.markerId())],
    [ID.isTileServiceId, key => replace(key)(ID.tileServiceId())],
    [ID.isStyleId, key => replace(key)(ID.styleId(keymap[ID.associatedId(key)]))],
    [R.T, key => key]
  ])

  // Nasty side-effect: adds tuples (aka acc):
  entries.reduce((acc, [key, value]) => {
    acc.push([rewrite(key), value])
    return acc
  }, tuples)

  return tuples
}
