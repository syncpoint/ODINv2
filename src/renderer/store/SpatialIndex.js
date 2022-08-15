import RBush from 'rbush'
import * as L from '../../shared/level'

export function SpatialIndex (wkbDB) {
  this.wkbDB = wkbDB
  this.tree = new RBush()

  wkbDB.on('batch', event => console.log('[SpatialIndex/batch]', event))
  wkbDB.on('put', (key, value) => console.log('[SpatialIndex/put]', key, value))
  wkbDB.on('del', key => console.log('[SpatialIndex/del]', key))

  const item = ([key, value]) => ({
    key,
    minX: value.coordinates[0],
    minY: value.coordinates[1],
    maxX: value.coordinates[0],
    maxY: value.coordinates[1]
  })

  // Import symbols once for each fresh project database.
  window.requestIdleCallback(async () => {
    const items = (await L.tuples(this.wkbDB, 'feature:'))
      .filter(([_, value]) => value.type === 'Point')
      .map(item)
    this.tree.load(items)
  }, { timeout: 2000 })
}
