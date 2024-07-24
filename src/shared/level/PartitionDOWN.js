import util from 'util'
import { AbstractLevelDOWN, AbstractIterator } from 'abstract-leveldown'

/**
 *
 */
function Iterator (db, options) {
  AbstractIterator.call(this, db)
  this.options_ = options // remember if keys are requested
  this.properties = options.properties
  this.geometry = options.geometry

  // synched :: Boolean
  // Whether properties/geometry keys are in sync.
  this.insync = true
}

util.inherits(Iterator, AbstractIterator)

const next = it => new Promise((resolve, reject) => {
  it.next((err, key, value) => {
    if (err) reject(err)
    else resolve({ key, value })
  })
})

const consumed = it => it.key === undefined

Iterator.prototype._next = async function (callback) {

  try {
    // Fetch properties unconditionally and geometry only when keys matched.
    this.propertiesKV = await next(this.properties)
    if (this.insync) this.geometryKV = await next(this.geometry)

    // We are done, when both iterators are consumed.
    if (consumed(this.geometryKV) && consumed(this.propertiesKV)) {
      return this._nextTick(callback)
    }

    this.insync = this.propertiesKV.key === this.geometryKV.key

    const key = this.propertiesKV.key
    const value = this.insync
      ? { ...this.propertiesKV.value, geometry: this.geometryKV.value }
      : this.propertiesKV.value

    this._nextTick(callback, null, key, value)
  } catch (err) {
    this._nextTick(callback, err)
  }
}


/**
 * AbstractLevelDOWN which splits values into two different databases.
 * The value's optional `geometry` property is encoded as WKB to `wkbDB`.
 * All other properties are written as JSON to `jsonDB`.
 */
export const PartitionDOWN = function (jsonDB, wkbDB) {
  const manifest = { getMany: true }
  AbstractLevelDOWN.call(this, manifest)

  this.jsonDB = jsonDB
  this.wkbDB = wkbDB
}

util.inherits(PartitionDOWN, AbstractLevelDOWN)

const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates && !value.geometries) return false
    return true
  }
}

const safeget = async (level, key) => {
  try {
    return await level.get(key)
  } catch (err) {
    return undefined
  }
}

const safedel = async (level, key) => {
  try {
    return await level.del(key)
  } catch (err) {
    // Let it slide.
  }
}

/**
 * _put :: k -> {k, v}
 * _put :: k -> GeoJSON/Geometry
 * _put :: k -> *
 */
PartitionDOWN.prototype._put = async function (key, value, options, callback) {
  const err = this._checkKey(key) || this._checkValue(value)
  if (err) return this._nextTick(callback, err)

  // Cases
  // 1. value is GeoJSON/Geometry
  // 2. value is object with geometry property
  // 3. none of the above

  try {
    if (isGeometry(value)) {
      // 1. Only write geometry:
      await this.wkbDB.put(key, value)
    } else {
      const { geometry, ...others } = value
      // 2. Write geometry and other properties:
      if (isGeometry(geometry)) {
        await this.wkbDB.put(key, geometry)
        await this.jsonDB.put(key, others)
      } else {
        // 3. Write value as-is:
        await this.jsonDB.put(key, value)
      }
    }

    this._nextTick(callback)
  } catch (err) {
    this._nextTick(callback, err)
  }
}

/**
 * _get :: k
 */
PartitionDOWN.prototype._get = async function (key, options, callback) {
  const err = this._checkKey(key)
  if (err) return this._nextTick(callback, err)

  try {
    const geometry = await safeget(this.wkbDB, key)
    const others = await safeget(this.jsonDB, key)

    if (isGeometry(geometry)) {
      if (others === undefined) return this._nextTick(callback, null, geometry)
      else return this._nextTick(callback, null, { geometry, ...others })
    } else {
      if (others === undefined) return this._nextTick(callback, new Error('NotFound'))
      else return this._nextTick(callback, null, others)
    }
  } catch (err) {
    this._nextTick(callback, err)
  }
}

/**
 * _getMany :: [k]
 */
PartitionDOWN.prototype._getMany = async function (keys, options, callback) {
  const err = keys
    .map(key => this._checkKey(key))
    .find(err => err)

  if (err) return this._nextTick(callback, err)

  try {
    const geometry = await this.wkbDB.getMany(keys)
    const others = await this.jsonDB.getMany(keys)
    const entries = keys.map((_, index) => {
      if (isGeometry(geometry[index])) {
        if (!others[index]) return geometry[index]
        else return { geometry: geometry[index], ...others[index] }
      } else {
        if (!others) return undefined
        else return others[index]
      }
    })

    return this._nextTick(callback, null, entries)
  } catch (err) {
    this._nextTick(callback, err)
  }
}

/**
 * Note: We do not check if key exists at all.
 */
PartitionDOWN.prototype._del = async function (key, options, callback) {
  const err = this._checkKey(key)
  if (err) return this._nextTick(callback, err)

  try {
    await safedel(this.wkbDB, key)
    await safedel(this.jsonDB, key)
    this._nextTick(callback)
  } catch (err) {
    this._nextTick(callback, err)
  }
}

/**
 *
 */
PartitionDOWN.prototype._batch = async function (array, options, callback) {

  if (!Array.isArray(array)) {
    return this._nextTick(callback, new Error('batch(array) requires an array argument'))
  }

  const [geometries, properties] = array.reduce((acc, op) => {
    const [geometries, properties] = acc
    const { type, key, value } = op

    if (type === 'del') {
      // For 'del' batch seems to ignore keys which do not exist.
      geometries.push(op)
      properties.push(op)
    } else if (type === 'put') {
      if (isGeometry(value)) geometries.push(op)
      else {
        const { geometry, ...others } = value
        if (isGeometry(geometry)) {
          geometries.push({ type: 'put', key, value: geometry })
          properties.push({ type: 'put', key, value: others })
        } else {
          properties.push({ type: 'put', key, value })
        }
      }
    }

    return acc
  }, [[], []])

  try {
    if (geometries.length) await this.wkbDB.batch(geometries)
    if (properties.length) await this.jsonDB.batch(properties)
    this._nextTick(callback)
  } catch (err) {
    this._nextTick(callback, err)
  }
}

/**
 *
 */
PartitionDOWN.prototype._iterator = function (options) {
  // Keys are necessary to synchronize iterators:
  return new Iterator(this, {
    ...options,
    properties: this.jsonDB.iterator({ ...options, keys: true }),
    geometry: this.wkbDB.iterator({ ...options, keys: true })
  })
}
