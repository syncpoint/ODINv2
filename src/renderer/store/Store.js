import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { scope, isFeatureId, isLayerId, isDeletableId, isTaggableId, layerUUID, lockedId, hiddenId, tagsId, layerId, featureId, defaultId } from '../ids'
import * as L from '../../shared/level'
import { PartitionDOWN } from '../../shared/level/PartitionDOWN'
import * as TS from '../ol/ts'
import { readGeometry, transform, geometryType } from '../model/geometry'


/**
 * Persistence for layers, features and associated information.
 *
 * addTag :: k -> String -> unit
 * batch :: (leveldb, operations) -> unit
 * collectKeys :: ([k], [String]) -> [k]
 * defaultLayerId :: () -> k
 * delete :: [k] -> unit
 * dictionary :: String -> {k: v}
 * dictionary :: String -> (k -> k) -> {k: v}
 * dictionary :: [k] -> {k: v}
 * dictionary :: [k] -> (k -> k) -> {k: v}
 * insert :: [[k, v]] -> unit
 * insertGeoJSON :: GeoJSON/FeatureCollection -> unit
 * insertGeoJSON :: [GeoJSON/Feature] -> unit
 * keys :: String -> [k]
 * removeTag :: k -> String -> unit
 * rename :: (k, String) -> unit
 * setDefaultLayer :: k -> unit
 * tuples :: String -> [[k, v]]
 * tuples :: [k] -> [[k, v]]
 * unsetDefaultLayer :: k -> unit
 * update :: { k: v } -> (v -> v) -> unit
 * update :: [k] -> [v] -> [v] -> unit
 * update :: [k] -> [v] -> unit
 * value :: k -> v
 * values :: String -> [v]
 * values :: [k] -> [v]
 */
export function Store (jsonDB, wkbDB, undo, selection) {
  Emitter.call(this)

  this.jsonDB = jsonDB
  this.wkbDB = wkbDB
  this.undo = undo
  this.selection = selection
  this.db = L.leveldb({ down: new PartitionDOWN(jsonDB, wkbDB) })
}

util.inherits(Store, Emitter)

/**
 * @async
 * collectKeys :: ([k], [String]) -> [k]
 */
Store.prototype.collectKeys = async function (ids, include = []) {
  const consider = x => include.includes(x)
  const featureIds = id => L.readKeys(this.jsonDB, L.prefix(`feature:${layerUUID(id)}`))
  const hiddenIds = id => L.readKeys(this.jsonDB, L.prefix(hiddenId(id)))
  const linkIds = id => L.readKeys(this.jsonDB, L.prefix(`link+${id}`))
  const tagsIds = id => L.readKeys(this.jsonDB, L.prefix(tagsId(id)))
  const defaultIds = id => L.readKeys(this.jsonDB, L.prefix(defaultId(id)))
  const hasLinks = id => consider('link') && (isLayerId(id) || isFeatureId(id))
  const hasFeatures = isLayerId
  const maybeHidden = id => consider('hidden') && (isLayerId(id) || isFeatureId(id))
  const maybeTagged = id => consider('tags') && isTaggableId(id)
  const maybeDefault = id => consider('default') && isLayerId(id)

  const collect = (acc, ids) => {
    acc.push(...ids)

    return ids.reduce(async (acc, id) => {
      const xs = await acc
      const ys = []
      if (hasFeatures(id)) ys.push(...await featureIds(id))
      if (hasLinks(id)) ys.push(...await linkIds(id))
      if (maybeHidden(id)) ys.push(...await hiddenIds(id))
      if (maybeTagged(id)) ys.push(...await tagsIds(id))
      if (maybeDefault(id)) ys.push(...await defaultIds(id))

      await collect(xs, ys)
      return xs
    }, acc)
  }

  return R.uniq(await collect([], ids))
}


/**
 * @async
 * tuples :: String -> [[k, v]]
 * tuples :: [k] -> [[k, v]]
 */
Store.prototype.tuples = async function (arg) {
  return L.tuples(this.db, arg)
}


/**
 * @async
 * values :: String -> [v]
 * values :: [k] -> [v]
 */
Store.prototype.values = async function (arg) {
  return L.values(this.db, arg)
}


/**
 * @async
 * dictionary :: String -> {k: v}
 * dictionary :: String -> (k -> k) -> {k: v}
 * dictionary :: [k] -> {k: v}
 * dictionary :: [k] -> (k -> k) -> {k: v}
 */
Store.prototype.dictionary = async function (...args) {
  const fn = args.length === 2 && typeof (args[1] === 'function')
    ? args[1]
    : R.identity

  const tuples = await this.tuples(args[0])
  const entries = tuples.map(([key, value]) => [fn(key), value])
  return Object.fromEntries(entries)
}


/**
 * @async
 * value :: k -> v
 */
Store.prototype.value = async function (key) {
  return this.db.get(key)
}


/**
 * update :: { k: v } -> (v -> v) -> unit
 * update :: [k] -> (v -> v) -> unit
 * update :: [k] -> [v] -> [v] -> unit
 * update :: [k] -> [v] -> unit
 */
Store.prototype.update = async function (...args) {
  if (args.length === 2) {
    if (typeof args[1] === 'function') {
      if (Array.isArray(args[0])) {
        // update :: [k] -> (v -> v) -> unit
        const [keys, fn] = args
        const oldValues = await L.values(this.db, keys)
        const newValues = oldValues.map(fn)
        return this.update(keys, newValues, oldValues)
      } else {
        // update :: { k: v } -> (v -> v) -> unit
        const [values, fn] = args
        const keys = Object.keys(values)
        const oldValues = Object.values(values)
        const newValues = oldValues.map(fn)
        return this.update(keys, newValues, oldValues)
      }
    } else {
      // update :: [k] -> [v] -> unit
      // No undo, direct update.
      const [keys, values] = args
      this.batch(this.db, R.zip(keys, values).map(([key, value]) => L.putOp(key, value)))
    }
  } else if (args.length === 3) {
    // update :: [k] -> [v] -> [v] -> unit
    const [keys, newValues, oldValues] = args
    const command = this.updateCommand(this.db, keys, newValues, oldValues)
    this.undo.apply(command)
  }
}


/**
 * @async
 * insert :: [[k, v]] -> unit
 */
Store.prototype.insert = function (tuples) {
  const command = this.insertCommand(this.db, tuples)
  this.undo.apply(command)
}


/**
 * @async
 * keys :: String -> [k]
 */
Store.prototype.keys = function (prefix) {
  return L.readKeys(this.jsonDB, L.prefix(prefix))
}


/**
 * batch :: (leveldb, operations, {k: v}) -> unit
 */
Store.prototype.batch = async function (db, operations, options = {}) {
  // FIXME: probably not the right place for selection handling
  const removals = operations.filter(({ type }) => type === 'del').map(({ key }) => key)
  this.selection.deselect(removals)

  await db.batch(operations)
  this.emit('batch', { operations, ...options })
}


/**
 * @async
 * delete :: [k] -> unit
 */
Store.prototype.delete = async function (ids) {

  // Don't delete locked entries:
  const locks = Object.fromEntries(await this.tuples(ids.map(lockedId)))
  const deletableIds = ids
    .filter(isDeletableId)
    .filter(key => !locks[lockedId(key)])

  const keys = await this.collectKeys(deletableIds, ['link', 'hidden', 'tags', 'default'])
  const tuples = await L.tuples(this.db, keys)
  const command = this.deleteCommand(this.db, tuples)
  this.undo.apply(command)
}


/**
 * @async
 * hide :: [k] -> unit
 */
Store.prototype.hide = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.putOp(hiddenId(key), true))
  this.batch(this.jsonDB, operations)
}


/**
 * @sync
 * show :: [k] -> unit
 */
Store.prototype.show = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.delOp(hiddenId(key)))
  this.batch(this.jsonDB, operations)
}


/**
 * @async
 * lock :: [k] -> unit
 */
Store.prototype.lock = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.putOp(lockedId(key), true))
  this.batch(this.jsonDB, operations)
}


/**
 * @sync
 * unlock :: [k] -> unit
 */
Store.prototype.unlock = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.delOp(lockedId(key)))
  this.batch(this.jsonDB, operations)
}

/**
 * @async
 * geometries :: [k] -> [GeoJSON/Geometry]
 * geometries :: 'layer:...' -> [GeoJSON/Geometry]
 * geometries :: k -> [GeoJSON/Geometry]
 */
Store.prototype.geometries = function (arg) {
  if (Array.isArray(arg)) return L.values(this.wkbDB, arg)
  else if (isLayerId(arg)) return L.values(this.wkbDB, `feature:${arg.split(':')[1]}`)
  else L.values(this.wkbDB, [arg])
}

const featureBounds = {
  Polygon: R.identity,
  LineString: (geometry, resolution) => TS.lineBuffer(geometry)(resolution * 10),
  'LineString:Point': geometry => {
    const [lineString, point] = TS.geometries(geometry)
    const segment = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate))
    const width = segment.getLength()
    return TS.lineBuffer(lineString)(width)
  },
  MultiPoint: geometry => {
    const [center, ...coords] = TS.coordinates(geometry)
    const ranges = coords.map(coord => TS.segment(center, coord).getLength())
    const range = Math.max(...ranges)
    return TS.pointBuffer(TS.point(center))(range)
  }
}

Store.prototype.layerBounds = function (acc, ids) {
  const read = R.compose(TS.read, readGeometry)
  const write = TS.write

  return ids.reduce(async (acc, id) => {
    const geometries = await this.geometries(id)
    if (!geometries.length) return acc

    const bounds = await acc
    const collection = TS.collect(geometries.map(read))
    bounds.push(write(TS.minimumRectangle(collection)))
    return bounds
  }, acc)
}

Store.prototype.geometryBounds = async function (acc, ids, resolution) {
  const geometries = await this.geometries(ids)
  return geometries
    .map(readGeometry)
    .reduce((acc, geometry) => {
      const type = geometryType(geometry)
      const { read, write } = transform(geometry)
      const bounds = featureBounds[type] || (geometry => TS.minimumRectangle(geometry))
      acc.push(write(bounds(read(geometry), resolution)))
      return acc
    }, acc)
}

Store.prototype.featureBounds = Store.prototype.geometryBounds
Store.prototype.markerBounds = Store.prototype.geometryBounds


Store.prototype.geometryBounds = async function (ids, resolution) {
  const scopes = Object.entries(R.groupBy(id => scope(id), ids))

  return scopes.reduce(async (acc, [scope, keys]) => {
    const handler = this[`${scope}Bounds`]
    if (!handler) return acc
    return handler.call(this, acc, keys, resolution)
  }, [])
}

/**
 * setDefaultLayer :: k -> unit
 */
Store.prototype.setDefaultLayer = async function (id) {
  const current = await L.tuples(this.jsonDB, 'default+layer:')
  this.undo.apply(this.undo.composite([
    this.deleteCommand(this.jsonDB, current),
    this.insertCommand(this.jsonDB, [[defaultId(id), true]])
  ]))
}


/**
 * unsetDefaultLayer :: k -> unit
 */
Store.prototype.unsetDefaultLayer = async function (id) {
  const current = await L.tuples(this.jsonDB, 'default+layer:')
  this.undo.apply(this.deleteCommand(this.jsonDB, current))
}


/**
 * defaultLayerId :: () -> k
 */
Store.prototype.defaultLayerId = async function () {
  const keys = await L.readKeys(this.jsonDB, L.prefix(defaultId('layer:')))
  return keys.length && layerId(keys[0])
}


/**
 * insertGeoJSON :: GeoJSON/FeatureCollection -> unit
 * insertGeoJSON :: [GeoJSON/Feature] -> unit
 *
 * Features id properties if present are ignored.
 * Default layer is created as necessary.
 */
Store.prototype.insertGeoJSON = async function (geoJSON) {
  const features = Array.isArray(geoJSON)
    ? geoJSON
    : geoJSON.features

  const tuples = []

  // Get or create default layer.
  let id = await this.defaultLayerId()
  if (!id) {
    id = layerId()
    tuples.push([id, { name: 'Default Layer' }])
    tuples.push([defaultId(id), true])
  }

  features.forEach(feature => tuples.push([featureId(id), feature]))
  this.insert(tuples)
}


/**
 * @async
 * rename :: (k, String) -> unit
 */
Store.prototype.rename = async function (id, name) {
  const oldValue = await this.jsonDB.get(id)
  const newValue = { ...oldValue, name }
  const command = this.updateCommand(this.jsonDB, [id], [newValue], [oldValue])
  this.undo.apply(command)
}


/**
 * @async
 * addTag :: k -> String -> unit
 */
Store.prototype.addTag = async function (id, name) {
  if (name === 'default') return this.setDefaultLayer(id)

  const addTag = name => tags => R.uniq([...(tags || []), name])
  const taggableIds = this.selection.selected(isTaggableId)
  const ids = R.uniq([id, ...taggableIds]).map(tagsId)
  const values = await this.jsonDB.getMany(ids) // may include undefined entries
  const oldValues = values.map(value => value || [])
  const newValues = oldValues.map(addTag(name))
  const command = this.updateCommand(this.jsonDB, ids, newValues, oldValues)
  this.undo.apply(command)
}


/**
 * @async
 * removeTag :: k -> String -> unit
 */
Store.prototype.removeTag = async function (id, name) {
  if (name === 'default') return this.unsetDefaultLayer(id)

  const removeTag = name => tags => (tags || []).filter(tag => tag !== name)
  const taggableIds = this.selection.selected(isTaggableId)
  const ids = R.uniq([id, ...taggableIds]).map(tagsId)
  const values = await this.jsonDB.getMany(ids) // may include undefined entries
  const oldValues = values.map(value => value || [])
  const newValues = oldValues.map(removeTag(name))
  const command = this.updateCommand(this.jsonDB, ids, newValues, oldValues)
  this.undo.apply(command)
}


Store.prototype.insertCommand = function (db, tuples, options = {}) {
  const apply = () => this.batch(db, tuples.map(([key, value]) => L.putOp(key, value)), options)
  const inverse = () => this.deleteCommand(db, tuples)
  return this.undo.command(apply, inverse)
}


Store.prototype.deleteCommand = function (db, tuples, options = {}) {
  const apply = () => this.batch(db, tuples.map(([key]) => L.delOp(key)), options)
  const inverse = () => this.insertCommand(db, tuples)
  return this.undo.command(apply, inverse)
}


Store.prototype.updateCommand = function (db, keys, newValues, oldValues, options = {}) {
  const apply = () => this.batch(db, R.zip(keys, newValues).map(([key, value]) => L.putOp(key, value)), options)
  const inverse = () => this.updateCommand(db, keys, oldValues, newValues, options)
  return this.undo.command(apply, inverse)
}
