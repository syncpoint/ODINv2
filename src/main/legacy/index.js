import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { readSources } from './io'
import { readProjects } from './projects'
import { tuplePartition, geometryPartition } from '../../shared/stores'


/**
 * Copy single project to dedicated project database.
 * Project databases are only created once from main process and
 * are then used only by renderer.
 *
 * @param {*} db plain leveldown instance, i.e. without encodings
 * @param {*} project project to transfer
 */
export const transferProject = async (db, project) => {
  const put = ([key, value]) => ({ type: 'put', key, value })
  const { layers, preferences } = project
  const tuples = tuplePartition(db)
  const geometries = geometryPartition(db)

  await tuples.put('session:viewport', preferences.viewport)

  // [layerId -> { name: layerName }]
  await tuples.batch(Object.entries(layers)
    .map(([id, { name }]) => [id, { name }])
    .map(put)
  )

  // [featureId -> { properties }]
  await tuples.batch(Object.values(layers)
    .flatMap(({ features }) => Object.entries(features))
    .map(([id, feature]) => [id, { properties: feature.properties }])
    .map(put)
  )

  // [featureId -> geometry (WKB)]
  await geometries.batch(Object.values(layers)
    .flatMap(({ features }) => Object.entries(features))
    .map(([id, feature]) => [id, feature.geometry])
    .map(put)
  )
}


/**
 * @param {String} location directory for legacy data (ODIN_HOME)
 * @param {Master} master master/main database
 * @param {String} databases directory to store project databases
 */
export const transferLegacy = async (location, master, databases) => {
  await master.transferSources(await readSources(location))
  const projects = await readProjects(location)
  await master.transferMetadata(projects)

  const entries = Object.entries(projects)
  const promises = await entries.map(async ([id, project]) => {
    const uuid = id.split(':')[1]
    const location = path.join(databases, uuid)
    const db = levelup(leveldown(location))
    await transferProject(db, project)
    return db.close()
  }, {})

  await Promise.all(promises)
}
