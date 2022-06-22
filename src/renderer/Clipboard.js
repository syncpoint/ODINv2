import * as R from 'ramda'
import { isFeatureId, isLayerId, isLinkId, isTagsId, layerId, tagsId, ord, featureId, linkId, containerId, associatedId, defaultId } from './ids'

const CONTENT_TYPE = 'application/json;vnd=odin'

const canCopy = id => isLayerId(id) || isFeatureId(id)

export const writeEntries = async (entries) => {
  const clipboardObject = {
    contentType: CONTENT_TYPE,
    entries
  }

  navigator.clipboard.writeText(JSON.stringify(clipboardObject))
}

export const readEntries = async () => {
  const content = await navigator.clipboard.readText()
  if (!content) return

  try {
    const clipboardObject = JSON.parse(content)
    if (!clipboardObject.contentType === CONTENT_TYPE) return

    return clipboardObject.entries
  } catch (ignored) {
    // this is an expected error in case the content is not parsable JSON
  }
}


const dispatch = action => {
  return event => {
    if (event.target.nodeName === 'INPUT') {
      return true // let browser handle default action
    }
    action()
  }
}

export function Clipboard (selection, featureStore) {
  this.selection = selection
  this.featureStore = featureStore

  document.addEventListener('copy', dispatch(this.copy.bind(this)))
  document.addEventListener('cut', dispatch(this.cut.bind(this)))
  document.addEventListener('paste', dispatch(this.paste.bind(this)))
}

Clipboard.doCopy = async (featureStore, selected) => {
  const ids = selected.filter(canCopy)
  const keys = await featureStore.collectKeys(ids, ['tags', 'link'])
  const tuples = await featureStore.tuples(keys)
  writeEntries(tuples)
  return keys
}

Clipboard.doDelete = (featureStore, keys) => {
  featureStore.delete(keys)
}

Clipboard.prototype.copy = async function () {
  const selected = this.selection.selected()
  Clipboard.doCopy(this.featureStore, selected)
}

Clipboard.prototype.cut = async function () {
  const selected = this.selection.selected()
  const keys = await Clipboard.doCopy(this.featureStore, selected)
  Clipboard.doDelete(this.featureStore, keys)
}

Clipboard.prototype.paste = async function () {
  const entries = (await readEntries()).sort(([a], [b]) => ord(a) - ord(b))
  const entrymap = Object.fromEntries(entries)

  // Collect all features which are not included in a layer
  // which itself is also part of selection.
  // These (uncovered) features will be assigned to default layer.

  const uncoveredFeaturesIds = entries.reduce((acc, [key]) => {
    if (!isFeatureId(key)) return acc
    if (entrymap[layerId(key)]) return acc
    acc.push(key)
    return acc
  }, [])

  // Create default layer if necessary.

  const tuples = []
  let defaultLayerId = await this.featureStore.defaultLayerId()
  if (uncoveredFeaturesIds.length && !defaultLayerId) {
    defaultLayerId = layerId()
    tuples.push([defaultLayerId, { name: 'Default Layer' }])
    tuples.push([defaultId(defaultLayerId), ['default']])
  }

  // All (uncovered) features where layer is not explicitly included
  // in selection are assigned to default layer.

  const keymap = uncoveredFeaturesIds.reduce((acc, featureId) => {
    // Map old (uncovered) layer to default layer:
    acc[layerId(featureId)] = defaultLayerId
    return acc
  }, {})


  // Add new replacement to keymap (old key -> new key):
  const replace = key => R.tap(replacement => (keymap[key] = replacement))

  const rewrite = R.cond([
    [isLayerId, key => replace(key)(layerId())],
    [isFeatureId, key => replace(key)(featureId(keymap[layerId(key)]))],
    [isLinkId, key => replace(key)(linkId(keymap[containerId(key)]))],
    [isTagsId, key => replace(key)(tagsId(keymap[associatedId(key)]))],
    [R.T, key => key]
  ])

  // Nasty side-effect adds tuples (aka acc):
  entries.reduce((acc, [key, value]) => {
    acc.push([rewrite(key), value])
    return acc
  }, tuples)

  this.featureStore.insert(tuples)
}
