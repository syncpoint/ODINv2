import path from 'path'
import levelup from 'levelup'
import leveldown from 'leveldown'
import { readSources } from './io'
import { readProjects } from './projects'
import { propertiesPartition, geometryPartition } from '../../shared/stores'


/**
 * Copy single project to dedicated project database.
 * Project databases are only created once from main process and
 * are then used only by renderer.
 *
 * @param {*} db plain leveldown instance, i.e. without encodings
 * @param {*} project project to transfer
 */
export const transferProject = async (db, project) => {
  const { layers, links } = project
  const properties = propertiesPartition(db)
  const geometries = geometryPartition(db)

  // Layers.
  {
    const op = layer => ({
      type: 'put',
      key: layer.id,
      value: { id: layer.id, name: layer.name }
    })

    const batch = layers.map(op)
    await properties.batch(batch)
  }

  // Feature properties.
  {
    const op = feature => ({
      type: 'put',
      key: feature.id,
      value: feature
    })

    const batch = layers.flatMap(({ features }) => features).map(op)
    await properties.batch(batch)
  }

  // (Feature) links.
  {
    const op = link => ({
      type: 'put',
      key: link.id,
      value: link
    })

    const batch = links.map(op)
    await properties.batch(batch)
  }

  // Feature geometries.
  {
    const op = feature => ({
      type: 'put',
      key: feature.id,
      value: feature.geometry
    })

    const batch = layers.flatMap(({ features }) => features).map(op)
    await geometries.batch(batch)
  }
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
    const db = levelup(leveldown(location))
    await transferProject(db, project)
    return db.close()
  }))
}
