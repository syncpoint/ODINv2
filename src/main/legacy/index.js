import path from 'path'
import { readSources } from './io'
import { readProjects } from './projects'
import { jsonDB, wbkDB, leveldb } from '../../shared/level'


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
  const properties = jsonDB(db)
  const geometries = wbkDB(db)

  // Layers.
  {
    const op = layer => {
      const value = { id: layer.id, name: layer.name }
      if (layer.name === preferences.activeLayer) {
        value.tags = ['default']
      }

      return {
        type: 'put',
        key: layer.id,
        value
      }
    }

    const ops = layers.map(op)
    await properties.batch(ops)
  }

  // Feature geometries.
  {
    const op = feature => ({ type: 'put', key: feature.id, value: feature.geometry })
    const ops = layers.flatMap(({ features }) => features).map(op)
    await geometries.batch(ops)
  }

  // Feature properties.
  {
    const op = feature => ({ type: 'put', key: feature.id, value: feature })
    const ops = layers.flatMap(({ features }) => features)
      .map(feature => { delete feature.geometry; return feature })
      .map(op)

    await properties.batch(ops)
  }

  // (Feature) links.
  {
    const op = link => ({ type: 'put', key: link.id, value: link })
    const ops = links.map(op)
    await properties.batch(ops)
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
    const db = leveldb({ location })
    await transferProject(db, project)
    return db.close()
  }))
}
