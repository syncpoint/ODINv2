import * as R from 'ramda'
import util from 'util'
import Emitter from '../../shared/emitter'
import { Query } from './Query'
import { isGroupId, isAssociatedId, associatedId } from '../ids'
import { options } from '../model/options'
import * as L from '../../shared/level'
import { documents } from './documents'
import { createIndex, parseQuery } from './MiniSearch'


const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const compare = fn => (a, b) => {
  const A = fn(a)
  const B = fn(b)
  return A
    ? B
      ? collator.compare(A, B)
      : -1
    : 1
}

export const sort = entries => entries.sort((a, b) => {
  // Sort group to the top:
  const GA = isGroupId(a.id)
  const GB = isGroupId(b.id)
  if (GA && !GB) return -1
  if (!GA && GB) return 1

  return compare(R.prop('title'))(a, b) ||
    compare(R.prop('description'))(a, b)
})



/**
 * @constructor
 */
export function SearchIndex (jsonDB) {
  Emitter.call(this)

  this.ready = false
  this.mirror = {}
  this.cachedDocuments = {}

  const cache = function (id) {
    return this.mirror[id]
  }

  this.cache = cache.bind(this)

  window.requestIdleCallback(async () => {
    const entries = await L.readTuples(jsonDB)
    this.mirror = Object.fromEntries(entries)
    this.index = createIndex()

    const documents = entries
      .map(([key, value]) => this.document(key, value, this.cache))
      .filter(R.identity)

    // Documents must be stored as is for later removal from index.
    documents.forEach(doc => (this.cachedDocuments[doc.id] = doc))
    this.index.addAll(documents)

    this.ready = true
    this.emit('ready')
  }, { timeout: 2000 })

  jsonDB.on('del', key => this.updateMirror([{ type: 'del', key }]))
  jsonDB.on('batch', event => this.updateMirror(event))
}

util.inherits(SearchIndex, Emitter)

SearchIndex.prototype.updateMirror = function (event) {
  event.forEach(op => {
    switch (op.type) {
      case 'put': this.mirror[op.key] = op.value; break
      case 'del': delete this.mirror[op.key]; break
    }
  })

  if (this.busy) {
    this.queue = this.queue || []
    this.queue.push(event)
    return
  }

  this.busy = true
  this.queue = []
  this.updateIndex(event)
  this.busy = false

  if (this.queue.length) this.handleBatch_(this.queue.flat())
  this.emit('index/updated')
}

SearchIndex.prototype.updateIndex = function (ops) {
  if (!this.index) return /* Not there yet! */

  const documents = ops.map(({ type, key, value }) => {

    // 'Associated information' is no document in its own right but some
    // arbitrary 'value object' associated with a main document.

    const id = isAssociatedId(key)
      ? associatedId(key)
      : key

    return isAssociatedId(key)
      ? [id, this.document(id, this.cache(id), this.cache)] // put/del: cached main entry
      : type === 'put'
        ? [id, this.document(id, value, this.cache)] // put: value from database update
        : [id, null] // del: remove from index/cache only
  })

  documents.forEach(([key, document]) => {
    if (this.cachedDocuments[key]) {
      this.index.remove(this.cachedDocuments[key])
      delete this.cachedDocuments[key]
    }

    if (document) {
      this.cachedDocuments[key] = document
      this.index.add(document)
    }
  })
}

SearchIndex.prototype.cache = function (id) {
  return this.mirror[id]
}

SearchIndex.prototype.document = function (key, value, cache) {
  if (!value) return null
  const scope = key.split(':')[0]
  const fn = documents[scope]
  if (!fn) return null
  return fn(key, value, cache)
}


/**
 * query :: String -> Promise(Query)
 */
SearchIndex.prototype.query = function (terms, callback) {
  const query = () => new Query(this, terms, callback)
  return new Promise((resolve) => {
    if (this.ready) resolve(query())
    else this.once('ready', () => resolve(query()))
  })
}


/**
 *
 */
SearchIndex.prototype.searchField = function (field, tokens) {

  // No search result is different from empty search result.
  if (!tokens.length) return null

  const options = field => ({ fields: [field], prefix: true, combineWith: 'AND' })
  const matches = this.index.search(tokens.join(' '), options(field))
  return matches.map(R.prop('id'))
}


/**
 * search :: String -> [Option]
 */
SearchIndex.prototype.search = function (terms) {
  const [query, searchOptions] = parseQuery(terms)
  const matches = searchOptions
    ? this.index.search(query, searchOptions)
    : this.index.search(query)

  const option = id => {
    const fn = options[id.split(':')[0]]
    if (!fn) return null
    return fn(id, this.cache)
  }

  const entries = matches.map(({ id }) => option(id)).filter(Boolean)
  return sort(entries)
}
