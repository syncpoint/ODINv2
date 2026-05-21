/**
 * Value-partitioning store.
 *
 * Routes a value's `geometry` to `wkbDB` (encoded as WKB) and the remaining
 * properties to `jsonDB` (encoded as JSON). A plain adapter over two
 * abstract-level child databases — it is not an abstract-level database
 * itself, but exposes the subset of the API the `L.*` helpers and `Store`
 * use: get / getMany / put / del / batch / iterator / keys / values.
 */
export function PartitionStore (jsonDB, wkbDB) {
  this.jsonDB = jsonDB
  this.wkbDB = wkbDB
}

const isGeometry = value => {
  if (!value) return false
  if (typeof value !== 'object') return false
  if (!value.type) return false
  if (!value.coordinates && !value.geometries) return false
  return true
}

/**
 * split :: value -> { geometry, properties }
 * Either part may be `undefined`:
 *   - value is a geometry           -> { geometry: value, properties: undefined }
 *   - value has a geometry property -> { geometry, properties: rest }
 *   - anything else                 -> { geometry: undefined, properties: value }
 */
const split = value => {
  if (isGeometry(value)) return { geometry: value, properties: undefined }

  if (value && typeof value === 'object') {
    const { geometry, ...properties } = value
    if (isGeometry(geometry)) return { geometry, properties }
  }

  return { geometry: undefined, properties: value }
}

const checkKey = key => {
  if (key === null || key === undefined) {
    throw new Error('key cannot be `null` or `undefined`')
  }
}

const checkValue = value => {
  if (value === null || value === undefined) {
    throw new Error('value cannot be `null` or `undefined`')
  }
}

/** combine :: (geometry, properties) -> value */
const combine = (geometry, properties) => {
  if (isGeometry(geometry)) {
    return properties === undefined ? geometry : { geometry, ...properties }
  }
  return properties
}

PartitionStore.prototype.put = async function (key, value) {
  checkKey(key)
  checkValue(value)
  const { geometry, properties } = split(value)
  await Promise.all([
    geometry !== undefined ? this.wkbDB.put(key, geometry) : Promise.resolve(),
    properties !== undefined ? this.jsonDB.put(key, properties) : Promise.resolve()
  ])
}

PartitionStore.prototype.get = async function (key) {
  checkKey(key)
  const [geometry, properties] = await Promise.all([
    this.wkbDB.get(key),
    this.jsonDB.get(key)
  ])
  return combine(geometry, properties)
}

PartitionStore.prototype.getMany = async function (keys) {
  const [geometries, properties] = await Promise.all([
    this.wkbDB.getMany(keys),
    this.jsonDB.getMany(keys)
  ])
  return keys.map((_, index) => combine(geometries[index], properties[index]))
}

PartitionStore.prototype.del = async function (key) {
  checkKey(key)
  await Promise.all([this.wkbDB.del(key), this.jsonDB.del(key)])
}

PartitionStore.prototype.batch = async function (operations) {
  if (!Array.isArray(operations)) {
    throw new Error('batch(array) requires an array argument')
  }

  const geometryOps = []
  const propertyOps = []

  for (const op of operations) {
    checkKey(op.key)
    if (op.type === 'del') {
      // A partition that never held the key ignores the del.
      geometryOps.push(op)
      propertyOps.push(op)
    } else if (op.type === 'put') {
      checkValue(op.value)
      const { geometry, properties } = split(op.value)
      if (geometry !== undefined) geometryOps.push({ type: 'put', key: op.key, value: geometry })
      if (properties !== undefined) propertyOps.push({ type: 'put', key: op.key, value: properties })
    }
  }

  await Promise.all([
    geometryOps.length ? this.wkbDB.batch(geometryOps) : Promise.resolve(),
    propertyOps.length ? this.jsonDB.batch(propertyOps) : Promise.resolve()
  ])
}

/**
 * Merge the two child iterators (both ascending by key) into a single
 * stream of reconstructed [key, value] entries.
 */
async function * merge (jsonDB, wkbDB, options) {
  const opts = { ...options }
  const limit = typeof opts.limit === 'number' && opts.limit >= 0 ? opts.limit : Infinity
  delete opts.limit

  const properties = jsonDB.iterator(opts)
  const geometries = wkbDB.iterator(opts)

  try {
    let p = await properties.next()
    let g = await geometries.next()
    let count = 0

    while (count < limit && (p !== undefined || g !== undefined)) {
      let key, value

      if (g === undefined || (p !== undefined && p[0] < g[0])) {
        // properties-only key
        [key, value] = p
        p = await properties.next()
      } else if (p === undefined || g[0] < p[0]) {
        // geometry-only key
        [key, value] = g
        g = await geometries.next()
      } else {
        // same key in both partitions
        key = p[0]
        value = combine(g[1], p[1])
        p = await properties.next()
        g = await geometries.next()
      }

      count += 1
      yield [key, value]
    }
  } finally {
    await properties.close()
    await geometries.close()
  }
}

PartitionStore.prototype.iterator = function (options) {
  return merge(this.jsonDB, this.wkbDB, options || {})
}

PartitionStore.prototype.keys = async function * (options) {
  for await (const [key] of this.iterator(options)) yield key
}

PartitionStore.prototype.values = async function * (options) {
  for await (const entry of this.iterator(options)) yield entry[1]
}
