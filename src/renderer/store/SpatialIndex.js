import * as R from 'ramda'
import RBush from 'rbush'
import * as L from '../../shared/level'
import { bbox } from './geometry'
import * as TS from '../ol/ts'

export function SpatialIndex (wkbDB) {
  this.wkbDB = wkbDB
  this.tree = new RBush()
  this.geoJSONReader = new TS.GeoJSONReader()

  wkbDB.on('batch', this.update.bind(this))
  // wkbDB.on('put', (key, value) => console.log('[SpatialIndex/put]', key, value))
  // wkbDB.on('del', key => console.log('[SpatialIndex/del]', key))

  // Import symbols once for each fresh project database.
  window.requestIdleCallback(async () => {
    const items = (await L.tuples(this.wkbDB, 'feature:'))
      .filter(([_, value]) => value.type === 'Point')
      .map(this.item.bind(this))
    this.tree.load(items)
  }, { timeout: 2000 })
}

SpatialIndex.prototype.search = function (geometry) {
  const [minX, minY, maxX, maxY] = bbox(geometry)
  const matches = this.tree.search({ minX, minY, maxX, maxY })
  const bounds = this.read(geometry)
  const exactMatches = matches.filter(match => TS.intersects(match.geometry, bounds))
  return exactMatches.map(R.prop('key'))
}

SpatialIndex.prototype.item = function ([key, value]) {
  return {
    key,
    geometry: this.read(value),
    minX: value.coordinates[0],
    minY: value.coordinates[1],
    maxX: value.coordinates[0],
    maxY: value.coordinates[1]
  }
}

SpatialIndex.prototype.read = function (geometry) {
  return this.geoJSONReader.read(geometry)
}

SpatialIndex.prototype.update = function (batch) {
  const all = this.tree.all().reduce((acc, item) => {
    acc[item.key] = item
    return acc
  }, {})

  batch
    .map(({ key }) => all[key])
    .filter(Boolean)
    .forEach(item => this.tree.remove(item))

  batch
    .filter(({ type }) => type === 'put')
    .filter(({ value }) => value.type === 'Point')
    .map(({ key, value }) => this.item([key, value]))
    .forEach(item => this.tree.insert(item))
}
