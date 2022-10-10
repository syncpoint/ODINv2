import * as R from 'ramda'
import util from 'util'
import Emitter from '../../shared/emitter'
import * as ID from '../ids'
import * as L from '../../shared/level'
import { createIndex, parseQuery } from './MiniSearch'
import { Disposable } from '../../shared/disposable'


const collator = new Intl.Collator('de-DE', { numeric: true, sensitivity: 'base' })
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
  const VA = ID.isViewId(a.id)
  const VB = ID.isViewId(b.id)
  if (VA && !VB) return -1
  if (!VA && VB) return 1

  return compare(R.prop('title'))(a, b) ||
    compare(R.prop('sort'))(a, b) || // optional sort criterion (e.g. places/distance)
    compare(R.prop('description'))(a, b)
})



/**
 * @constructor
 */
export default function SearchIndex (
  jsonDB,
  documentStore,
  optionStore,
  emitter,
  nominatim,
  sessionStore,
  spatialIndex
) {
  Emitter.call(this)

  this.jsonDB = jsonDB
  this.documentStore = documentStore
  this.optionStore = optionStore
  this.emitter = emitter
  this.nominatim = nominatim
  this.sessionStore = sessionStore
  this.spatialIndex = spatialIndex

  this.ready = false
  this.cachedDocuments = {}

  jsonDB.on('del', key => this.updateIndex([{ type: 'del', key }]))
  jsonDB.on('batch', event => this.updateIndex(event))
}

util.inherits(SearchIndex, Emitter)


/**
 *
 */
SearchIndex.prototype.bootstrap = async function () {
  const keys = await L.readKeys(this.jsonDB)
  this.index = createIndex()

  const pending = keys.map((key) => this.document(key))
  const documents = (await Promise.all(pending)).filter(Boolean)

  // Documents must be stored as is for later removal from index.
  documents.forEach(doc => (this.cachedDocuments[doc.id] = doc))
  this.index.addAll(documents)

  this.ready = true
  this.emit('ready')
}


/**
 *
 */
SearchIndex.prototype.updateIndex = async function (ops) {
  if (!this.index) return /* Not there yet! */

  const pending = ops.map(async ({ type, key, value }) => {

    // 'Associated information' is no document in its own right but some
    // arbitrary 'value object' associated with a main document.

    const id = ID.isAssociatedId(key)
      ? ID.associatedId(key)
      : key

    return ID.isAssociatedId(key)
      ? [id, await this.document(id)] // put/del: cached main entry
      : type === 'put'
        ? [id, await this.document(id)] // put: value from database update
        : [id, null] // del: remove from index/cache only
  })

  const documents = await Promise.all(pending)
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

  this.emit('index/updated')
}


/**
 *
 */
SearchIndex.prototype.document = function (key) {
  const scope = key.split(':')[0]
  const fn = this.documentStore[scope]
  if (!fn) return null
  return fn.call(this.documentStore, key)
}


/**
 * query :: String -> Promise(Query)
 */
SearchIndex.prototype.query = function (terms, options, callback) {
  const query = () => this.createQuery(terms, callback, options)
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
SearchIndex.prototype.search = async function (terms, options) {
  if (terms.includes('@place') && options.force) {
    const query = terms
      .replace(/([@#!&]\S+)/gi, '')
      .trim()
      .replace(/[ ]+/g, '+')

    this.nominatim.sync(query)
  }

  // Hit spatial index if requested.
  // Resulting identifiers are implicitly added to query filter.
  //
  const ids = R.ifElse(
    terms => terms.includes('&geometry:'),
    terms => {
      const [, geometry] = terms.match(/&geometry:(\S+)/)
      return this.spatialIndex.search(JSON.parse(geometry))
    },
    R.always([])
  )(terms)

  const [query, searchOptions] = parseQuery(terms, ids)
  const matches = searchOptions
    ? this.index.search(query, searchOptions)
    : this.index.search(query)

  const keys = matches.map(R.prop('id'))


  const option = id => {
    const scope = ID.scope(id)
    if (!this.optionStore[scope]) return null
    return this.optionStore[scope](id)
  }

  // (Pre-)sort ids to compensate for changing match scores
  // and thus seemingly random order in sidebar.
  //
  const sortedIds = keys.sort()
  const entries = await Promise.all(sortedIds.map(option))
  const result = sort(entries.filter(Boolean))
  return result
}


/**
 *
 */
SearchIndex.prototype.createQuery = function (terms, callback, options) {
  let disposed = false
  const refresh = async () => {
    try {
      const result = await this.search(terms, options)
      if (!disposed) callback(result)
    } catch (err) {
      /* don't invoke callback. */
      console.log(err)
    }
  }

  refresh()
  const disposable = Disposable.of()
  disposable.add(() => (disposed = true))
  disposable.on(this, 'index/updated', refresh)
  disposable.on(this.emitter, 'preferences/changed', refresh)
  disposable.on(this.sessionStore, 'put', refresh)
  return disposable
}
