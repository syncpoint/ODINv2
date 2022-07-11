import * as R from 'ramda'
import * as ID from './ids'

const CONTENT_TYPE = 'application/json;vnd=odin'

const canCopy = id => ID.isLayerId(id) || ID.isFeatureId(id) || ID.isMarkerId(id)

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


/**
 *
 */
export function Clipboard (selection, store) {
  this.selection = selection
  this.store = store

  document.addEventListener('copy', dispatch(this.copy.bind(this)))
  document.addEventListener('cut', dispatch(this.cut.bind(this)))
  document.addEventListener('paste', dispatch(this.paste.bind(this)))
}

Clipboard.doCopy = async (store, selected) => {
  const ids = selected.filter(canCopy)
  const keys = await store.collectKeys(ids, ['tags', 'link'])
  const tuples = await store.tuples(keys)
  writeEntries(tuples)
  return keys
}

Clipboard.doDelete = (store, keys) => {
  store.delete(keys)
}

Clipboard.prototype.copy = async function () {
  const selected = this.selection.selected()
  Clipboard.doCopy(this.store, selected)
}

Clipboard.prototype.cut = async function () {
  const selected = this.selection.selected()
  const keys = await Clipboard.doCopy(this.store, selected)
  Clipboard.doDelete(this.store, keys)
}

Clipboard.prototype.paste = async function () {
  const entries = (await readEntries()).sort(([a], [b]) => ID.ord(a) - ID.ord(b))
  console.log(entries)
  const entrymap = Object.fromEntries(entries)

  // Collect all features which are not included in a layer
  // which itself is also part of selection.
  // These (uncovered) features will be assigned to default layer.

  const uncoveredFeaturesIds = entries.reduce((acc, [key]) => {
    if (!ID.isFeatureId(key)) return acc
    if (entrymap[ID.layerId(key)]) return acc
    acc.push(key)
    return acc
  }, [])

  // Create default layer if necessary.

  const tuples = []
  let defaultLayerId = await this.store.defaultLayerId()
  if (uncoveredFeaturesIds.length && !defaultLayerId) {
    defaultLayerId = ID.layerId()
    tuples.push([defaultLayerId, { name: 'Default Layer' }])
    tuples.push([ID.defaultId(defaultLayerId), ['default']])
  }

  // All (uncovered) features where layer is not explicitly included
  // in selection are assigned to default layer.

  const keymap = uncoveredFeaturesIds.reduce((acc, featureId) => {
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
    [R.T, key => key]
  ])

  // Nasty side-effect: adds tuples (aka acc):
  entries.reduce((acc, [key, value]) => {
    acc.push([rewrite(key), value])
    return acc
  }, tuples)

  this.store.insert(tuples)
}

Clipboard.prototype.delete = function () {
  const selected = this.selection.selected()
  this.store.delete(selected)
}
