import util from 'util'
import { AbstractLevelDOWN, AbstractIterator } from 'abstract-leveldown'

/**
 *
 */
function Iterator (db, options) {
  AbstractIterator.call(this, db)
  this.options_ = options // remember if keys are requested
  this.propertiesIterator_ = options.propertiesIterator
  this.geometriesIterator_ = options.geometriesIterator
  this.lastCompare_ = 0
}

util.inherits(Iterator, AbstractIterator)

const next = it => new Promise((resolve, reject) => {
  it.next((err, key, value) => {
    if (err) reject(err)
    else resolve({ key, value })
  })
})

Iterator.prototype._next = async function (callback) {

  try {
    // Depending on last key compare, take either one (!== 0) or both (=== 0) iterators:
    if (this.lastCompare_ <= 0) this.geometriesRecord_ = await next(this.geometriesIterator_)
    if (this.lastCompare_ >= 0) this.propertiesRecord_ = await next(this.propertiesIterator_)

    // Encode four cases:
    const path =
      (this.geometriesRecord_.key === undefined ? 0x01 : 0x02) |
      (this.propertiesRecord_.key === undefined ? 0x04 : 0x08)

    switch (path) {
      case 0x05: return this._nextTick(callback)
      case 0x06: this.lastCompare_ = -1; break
      case 0x09: this.lastCompare_ = 1; break
      case 0x0a: this.lastCompare_ = this.geometriesRecord_.key.localeCompare(this.propertiesRecord_.key); break
    }

    const { key, value } = (() => {
      if (this.lastCompare_ === 0) {
        const key = this.geometriesRecord_.key
        const value = { geometry: this.geometriesRecord_.value, ...this.propertiesRecord_.value }
        return { key, value }
      } else if (this.lastCompare_ < 0) return this.geometriesRecord_
      else return this.propertiesRecord_
    })()

    this._nextTick(callback, null, key, value)
  } catch (err) {
    this._nextTick(callback, err)
  }
}


/**
 *
 */
export const PartitionDOWN = function (propertiesLevel, geometriesLevel) {
  AbstractLevelDOWN.call(this)
  this.properties_ = propertiesLevel
  this.geometries_ = geometriesLevel
}

util.inherits(PartitionDOWN, AbstractLevelDOWN)

const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates) return false
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
      await this.geometries_.put(key, value)
    } else {
      const { geometry, ...others } = value
      // 2. Write geometry and other properties:
      if (isGeometry(geometry)) {
        await this.geometries_.put(key, geometry)
        await this.properties_.put(key, others)
      } else {
        // 3. Write value as-is:
        await this.properties_.put(key, value)
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
    const geometry = await safeget(this.geometries_, key)
    const others = await safeget(this.properties_, key)

    if (isGeometry(geometry)) {
      if (!others) return this._nextTick(callback, null, geometry)
      else return this._nextTick(callback, null, { geometry, ...others })
    } else {
      if (!others) return this._nextTick(callback, new Error('NotFound'))
      else return this._nextTick(callback, null, others)
    }
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
    await safedel(this.geometries_, key)
    await safedel(this.properties_, key)
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
    if (geometries.length) await this.geometries_.batch(geometries)
    if (properties.length) await this.properties_.batch(properties)
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
  const propertiesIterator = this.properties_.iterator({ ...options, keys: true })
  const geometriesIterator = this.geometries_.iterator({ ...options, keys: true })
  return new Iterator(this, {
    ...options,
    propertiesIterator,
    geometriesIterator
  })
}
