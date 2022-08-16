import path from 'path'
import { readSources } from './io'
import { readProjects } from './projects'
import * as L from '../../shared/level'


/**
 * Copy single project to dedicated project database.
 * Project databases are only created once from main process and
 * are then used only by renderer.
 *
 * @param {*} db plain leveldown instance, i.e. without encodings
 * @param {*} project project to transfer
 */
export const transferProject = async (db, project) => {
  const { layers, links, preferences } = project
  const jsonDB = L.jsonDB(db)
  const wkbDB = L.wkbDB(db)

  const json = []
  const wkb = []

  // Layers.
  layers.reduce((acc, { id, name }) => {
    acc.push(L.putOp(id, { name }))
    if (name === preferences.activeLayer) {
      acc.push(L.putOp(`tags+${id}`, ['default']))
    }

    return acc
  }, json)

  const features = layers.flatMap(({ features }) => features)

  // Feature properties.
  features.reduce((acc, { id, name, properties }) => {
    const value = { type: 'Feature', name, properties }
    if (name) value.name = name
    acc.push(L.putOp(id, value))
    return acc
  }, json)

  // Feature geometries.
  features.reduce((acc, { id, geometry }) => {
    acc.push(L.putOp(id, geometry))
    return acc
  }, wkb)

  // (Feature) links.
  links.reduce((acc, { id, name, url }) => {
    acc.push(L.putOp(id, { name, url }))
    return acc
  }, json)

  await jsonDB.batch(json)
  await wkbDB.batch(wkb)
}



/**
 * @param {String} location directory for legacy data (ODIN_HOME)
 * @param {Master} legacyStore master/main database
 * @param {String} databases directory to store project databases
 */
export const transferLegacy = async (location, legacyStore, databases) => {
  await legacyStore.transferSources(await readSources(location))
  const projects = await readProjects(location)
  await legacyStore.transferMetadata(projects)

  await Promise.all(projects.map(async project => {
    const uuid = project.id.split(':')[1]
    const location = path.join(databases, uuid)
    const db = L.leveldb({ location })
    await transferProject(db, project)
    return db.close()
  }))
}
