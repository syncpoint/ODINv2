/*
  Room for improvement
  - PartitionDOWN must not explicitly know about features.
  - generalize for objects having property geometry :: geoJSON/Geometry
  - to address geometries directly, use keys like
    geometry+feature:..., geometry+location:...
  - how about properties+feature:... to access properties only?
*/

import util from 'util'
import * as R from 'ramda'
import { AbstractLevelDOWN, AbstractIterator } from 'abstract-leveldown'

/**
 *
 */
function Iterator (db, options) {
  AbstractIterator.call(this, db)
  this.options_ = options // remember if keys are requested
  this.properties_ = options.properties
  this.geometries_ = options.geometries

  // true if geometries iterator is paused.
  this.paused_ = false
  this.buffer_ = {} // current/last geometries entry
}

util.inherits(Iterator, AbstractIterator)

Iterator.prototype._next = async function (callback) {
  // Properties range always includes geometries range.
  // properties:    -------|xxxxxxxxxxxxxxxx|--------
  // geometries:    ----------|xxxxxxx|--------------

  // On key mismatch, we pause geometries iterator.
  const next = it => new Promise((resolve, reject) => {
    it.next((err, key, value) => {
      if (err) reject(err)
      else resolve({ key, value })
    })
  })

  try {
    const properties = await next(this.properties_)
    if (!this.paused_) this.buffer_ = await next(this.geometries_)

    if (!properties.key && !this.buffer_.key) this._nextTick(callback) // all done.
    else if (properties.key === this.buffer_.key) {
      // Iterators are in sync; unpause geometries iterator (if paused).
      delete this.paused_
      const key = this.options_.keys ? properties.key : null
      const value = { ...properties.value, geometry: this.buffer_.value }
      this._nextTick(() => callback(null, key, value))
    } else {
      // Iterators are not in sync; pause geometries iterator.
      this.paused_ = true
      const key = this.options_.keys ? properties.key : null
      const value = properties.value
      this._nextTick(() => callback(null, key, value))
    }
  } catch (err) {
    this._nextTick(() => callback(err))
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

/**
 *
 */
PartitionDOWN.prototype._put = async function (key, value, options, callback) {

  // TODO: check for `geometry` property
  if (key.startsWith('feature:')) {
    const copy = { ...value }
    await this.geometries_.put(key, copy.geometry)

    // FIXME: don't mess-up caller's data structure
    delete copy.geometry
    await this.properties_.put(key, copy)
    this._nextTick(callback)
  } else {
    this.properties_.put(key, value, callback)
  }
}

/**
 *
 */
PartitionDOWN.prototype._get = async function (key, options, callback) {

  // TODO: assume all objects have `geometry` property
  if (key.startsWith('feature:')) {
    try {
      const properties = await this.properties_.get(key)
      const geometry = await this.geometries_.get(key)
      this._nextTick(() => callback(null, { ...properties, geometry }))
    } catch (err) {
      this._nextTick(() => callback(err))
    }
  } else {
    this.properties_.get(key, callback)
  }
}

/**
 *
 */
PartitionDOWN.prototype._del = async function (key, options, callback) {

  // TODO: assume all objects have `geometry` property
  if (key.startsWith('feature:')) {
    try {
      await this.properties_.del(key)

      // FIXME: throws if key is not known
      await this.geometries_.del(key)
      this._nextTick(callback)
    } catch (err) {
      this._mextTick(() => callback(err))
    }
  } else {
    this.properties_.del(key, callback)
  }
}

/**
 *
 */
PartitionDOWN.prototype._batch = async function (operations, options, callback) {

  // TODO: check for `geometry` property
  const { features, geometries, others } = R.groupBy(({ key }) => {
    return key.startsWith('feature:')
      ? 'features'
      : key.startsWith('geometry:')
        ? 'geometries'
        : 'others'
  }, operations)

  try {
    if (others && others.length) await this.properties_.batch(others)

    if (features && features.length) {
      const [properties, geometries] = features.reduce((acc, op) => {
        const [properties, geometries] = acc

        if (op.type === 'del') {
          properties.push(op)
          geometries.push(op)
        } else {
          const copy = { ...op.value }
          geometries.push({ type: op.type, key: op.key, value: copy.geometry })

          // FIXME: don't mess-up caller's data structure
          delete copy.geometry
          properties.push({ type: op.type, key: op.key, value: copy })
        }

        return acc
      }, [[], []])

      await this.properties_.batch(properties)
      await this.geometries_.batch(geometries)
    }

    if (geometries && geometries.length) {
      const ops = geometries.map(op => ({ ...op, key: `feature:${op.key.split(':')[1]}` }))
      await this.geometries_.batch(ops)
    }

    this._nextTick(callback)
  } catch (err) {
    this._nextTick(() => callback(err))
  }
}

/**
 *
 */
PartitionDOWN.prototype._iterator = function (options) {
  // Keys are necessary to synchronize iterators:
  const properties = this.properties_.iterator({ ...options, keys: true })
  const geometries = this.geometries_.iterator({ ...options, keys: true })
  return new Iterator(this, {
    ...options,
    properties,
    geometries
  })
}
