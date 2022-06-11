import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { scope, isFeatureId, isLayerId, isDeletableId, layerUUID, lockedId, hiddenId } from '../ids'
import * as L from '../../shared/level'
import { PartitionDOWN } from '../../shared/level/PartitionDOWN'
import * as TS from '../ol/ts'
import { readGeometry, transform, geometryType } from '../model/geometry'

/**
 * Persistence for layers, features and associated information.
 */
export function FeatureStore (jsonDB, wkbDB, undo, selection) {
  Emitter.call(this)

  this.jsonDB = jsonDB
  this.wkbDB = wkbDB
  this.undo = undo
  this.selection = selection
  this.db = L.leveldb({ down: new PartitionDOWN(jsonDB, wkbDB) })

  // Forward high-level batch event:
  this.db.on('batch', operations => {
    // FIXME: probably not the right place for selection handling
    const removals = operations.filter(({ type }) => type === 'del').map(({ key }) => key)
    this.selection.deselect(removals)
    this.emit('batch', { operations })
  })

  // window.requestIdleCallback(async () => {
  //   const junk = await L.readKeys(this.jsonDB, L.prefix('locked+hidden'))
  //   console.log('junk', junk)
  //   const operations = junk.map(L.deleteOp)
  //   await jsonDB.batch(operations)
  // }, { timeout: 0 })
}

util.inherits(FeatureStore, Emitter)

/**
 * @async
 * collectKeys :: ([k], [String]) -> [k]
 */
FeatureStore.prototype.collectKeys = async function (ids, include = []) {
  const add = x => include.includes(x)
  const featureIds = id => L.readKeys(this.jsonDB, L.prefix(`feature:${layerUUID(id)}`))
  const hiddenIds = id => L.readKeys(this.jsonDB, L.prefix(hiddenId(id)))
  const linkIds = id => L.readKeys(this.jsonDB, L.prefix(`link+${id}`))
  const hasLinks = id => add('link') && (isLayerId(id) || isFeatureId(id))
  const hasFeatures = isLayerId
  const maybeHidden = id => add('hidden') && (isLayerId(id) || isFeatureId(id))

  const collect = (acc, ids) => {
    acc.push(...ids)

    return ids.reduce(async (acc, id) => {
      const xs = await acc
      const ys = []
      if (hasFeatures(id)) ys.push(...await featureIds(id))
      if (hasLinks(id)) ys.push(...await linkIds(id))
      if (maybeHidden(id)) ys.push(...await hiddenIds(id))

      await collect(xs, ys)
      return xs
    }, acc)
  }

  return R.uniq(await collect([], ids))
}

/**
 * merge :: ([k, JSON], [k, WKB]) -> [k, { ...JSON, geometry: WKB}]
 */
FeatureStore.prototype.merge = function (json, wkb) {
  const values = json.reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})

  // Merge feature geometries:
  wkb.reduce((acc, [key, value]) => {
    acc[key].geometry = value
    return acc
  }, values)

  return Object.entries(values)
}

/**
 * split :: [v] -> [[WKB], [JSON]]
 */
FeatureStore.prototype.split = function (values) {
  return values.reduce((acc, { geometry, ...json }) => {
    acc[0].push(geometry)
    acc[1].push(json)
    return acc
  }, [[], []])
}

/**
 * @async
 * @deprecated use tuples()
 * select :: String -> [[k, v]]
 * select :: [k] -> [[k, v]]
 */
FeatureStore.prototype.select = async function (arg) {
  return L.tuples(this.db, arg)
}

/**
 * @async
 * @deprecated use tuples()
 * tuples :: String -> [[k, v]]
 * tuples :: [k] -> [[k, v]]
 */
FeatureStore.prototype.tuples = async function (arg) {
  return L.tuples(this.db, arg)
}

/**
 * @async
 * values :: String -> [v]
 * values :: [k] -> [v]
 */
FeatureStore.prototype.values = async function (arg) {
  return L.values(this.db, arg)
}

/**
 * update :: { k: v } -> (v -> v) -> unit
 * update :: [k] -> [v] -> [v] -> unit
 * update :: [k] -> [v] -> unit
 */
FeatureStore.prototype.update = async function (...args) {
  if (args.length === 2) {
    if (typeof args[1] === 'function') {
      const [values, fn] = args
      const keys = Object.keys(values)
      const oldValues = Object.values(values)
      const newValues = oldValues.map(fn)
      return this.update(keys, newValues, oldValues)
    } else {
      // No undo, direct update.
      const [keys, values] = args
      this.db.batch(R.zip(keys, values).map(([key, value]) => L.putOp(key, value)))
    }
  } else if (args.length === 3) {
    const [keys, newValues, oldValues] = args
    const command = this.updateCommand(this.db, keys, newValues, oldValues)
    this.undo.apply(command)
  }
}

/**
 * @async
 * insert :: [[k], [v]] -> unit
 */
FeatureStore.prototype.insert = function (tuples) {
  const command = this.insertCommand(this.db, tuples)
  this.undo.apply(command)
}

/**
 * @async
 * keys :: String -> [k]
 */
FeatureStore.prototype.keys = function (prefix) {
  return L.readKeys(this.jsonDB, L.prefix(prefix))
}

/**
 * @async
 * objects :: [k] -> {k: v}
 */
FeatureStore.prototype.objects = async function (keys) {
  const entries = await L.mgetTuples(this.jsonDB, keys)
  return Object.fromEntries(entries)
}

FeatureStore.prototype.batch = async function (db, operations) {
  await db.batch(operations)
  this.emit('batch', { operations })
}


/**
 * @async
 * delete :: [k] -> unit
 */
FeatureStore.prototype.delete = async function (ids) {
  const keys = await this.collectKeys(ids.filter(isDeletableId), ['link', 'hidden'])

  // Don't delete locked entries:
  const locks = await this.objects(keys.map(lockedId))
  const deletableKeys = keys.filter(key => !locks[lockedId(key)])
  const tuples = await L.tuples(this.db, deletableKeys)
  const command = this.deleteCommand(this.db, tuples)
  this.undo.apply(command)
}


/**
 * @async
 * hide :: [k] -> unit
 */
FeatureStore.prototype.hide = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.putOp(hiddenId(key), true))
  this.batch(this.jsonDB, operations)
}


/**
 * @sync
 * show :: [k] -> unit
 */
FeatureStore.prototype.show = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.deleteOp(hiddenId(key)))
  this.batch(this.jsonDB, operations)
}


/**
 * @async
 * lock :: [k] -> unit
 */
FeatureStore.prototype.lock = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.putOp(lockedId(key), true))
  this.batch(this.jsonDB, operations)
}


/**
 * @sync
 * unlock :: [k] -> unit
 */
FeatureStore.prototype.unlock = async function (ids, active) {
  if (active !== undefined) return
  const keys = await this.collectKeys(ids)
  const operations = keys.map(key => L.deleteOp(lockedId(key)))
  this.batch(this.jsonDB, operations)
}

/**
 * @async
 * geometries :: [k] -> [GeoJSON/Geometry]
 * geometries :: 'layer:...' -> [GeoJSON/Geometry]
 * geometries :: k -> [GeoJSON/Geometry]
 */
FeatureStore.prototype.geometries = function (arg) {
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

FeatureStore.prototype.layerBounds = function (acc, ids) {
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

FeatureStore.prototype.featureBounds = async function (acc, ids, resolution) {
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


FeatureStore.prototype.geometryBounds = async function (ids, resolution) {
  const scopes = Object.entries(R.groupBy(id => scope(id), ids))

  return scopes.reduce(async (acc, [scope, keys]) => {
    const handler = this[`${scope}Bounds`]
    if (!handler) return acc
    return handler.call(this, acc, keys, resolution)
  }, [])
}


FeatureStore.prototype.insertCommand = function (db, tuples) {
  const apply = () => db.batch(tuples.map(([key, value]) => L.putOp(key, value)))
  const inverse = () => this.deleteCommand(db, tuples)
  return this.undo.command(apply, inverse)
}


FeatureStore.prototype.deleteCommand = function (db, tuples) {
  const apply = () => db.batch(tuples.map(([key]) => L.deleteOp(key)))
  const inverse = () => this.insertCommand(db, tuples)
  return this.undo.command(apply, inverse)
}


FeatureStore.prototype.updateCommand = function (db, keys, newValues, oldValues) {
  const apply = () => db.batch(R.zip(keys, newValues).map(([key, value]) => L.putOp(key, value)))
  const inverse = () => this.updateCommand(db, keys, oldValues, newValues)
  return this.undo.command(apply, inverse)
}
