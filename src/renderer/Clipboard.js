import * as ID from './ids'
import { clone } from './model/Import'

export const CONTENT_TYPE = 'application/json;vnd=odin'

const canCopy = id =>
  ID.isLayerId(id) ||
  ID.isFeatureId(id) ||
  ID.isMarkerId(id) ||
  ID.isTileServiceId(id)

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


const dispatch = action => ({ target }) =>
  ['INPUT', 'TEXTAREA'].includes(target.nodeName)
    ? true // let browser handle default action
    : action()

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
  const keys = await store.collectKeys(ids, ['tags', 'link', 'style'])
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
  const entries = await readEntries()
  if (!entries) return
  const defaultLayerId = await this.store.defaultLayerId()
  const tuples = await clone(defaultLayerId, entries)
  this.store.insert(tuples)
}

Clipboard.prototype.delete = function () {
  const selected = this.selection.selected()
  this.store.delete(selected)
}
