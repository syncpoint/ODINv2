import * as ID from './ids'
import { clone } from './model/Import'

export const CONTENT_TYPE = 'application/json;vnd=odin'

const canCopy = id =>
  ID.isLayerId(id) ||
  ID.isFeatureId(id) ||
  ID.isMarkerId(id) ||
  ID.isTileServiceId(id)

/**
 * @async implicit
 */
export const writeEntries = entries => {
  const clipboardObject = {
    contentType: CONTENT_TYPE,
    entries
  }

  return navigator.clipboard.writeText(JSON.stringify(clipboardObject))
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
  await writeEntries(tuples)
  return keys
}

/**
 * @async implicit
 */
Clipboard.doDelete = (store, keys) => {
  return store.delete(keys)
}

/**
 * @async implicit
 */
Clipboard.prototype.copy = function () {
  const selected = this.selection.selected()
  return Clipboard.doCopy(this.store, selected)
}

Clipboard.prototype.cut = async function () {
  const selected = this.selection.selected()
  const keys = await Clipboard.doCopy(this.store, selected)
  return Clipboard.doDelete(this.store, keys)
}

/**
 * @async implicit
 */
Clipboard.prototype.paste = async function () {
  const entries = await readEntries()
  if (!entries) return
  const defaultLayerId = await this.store.defaultLayerId()
  const tuples = await clone(defaultLayerId, entries)
  return this.store.insert(tuples)
}

/**
 * @async implicit
 */
Clipboard.prototype.delete = function () {
  const selected = this.selection.selected()
  return this.store.delete(selected)
}
