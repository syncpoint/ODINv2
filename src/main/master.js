import path from 'path'
import fs from 'fs'
import level from 'level'
import sublevel from 'subleveldown'
import { wkb } from '../shared/encoding'
import { evented, EVENT } from './evented'

let db

const quit = () => db.close()


/**
 *
 */
export const open = directory => {
  const databases = path.join(directory, 'databases')
  const master = path.join(databases, 'master')
  fs.mkdirSync(databases, { recursive: true })
  db = level(master, { valueEncoding: 'json' })
  evented.on(EVENT.QUIT, quit)
}


/**
 * Expose database interface directly instead of
 * duplicating its rather simple API.
 *
 * At some point we probably might regret this.
 * But until then the usage pattern will have
 * emerged and we can abstract the database away.
 */
export const database = () => db

export const partitions = {
  tuples: db => sublevel(db, 'tuples', { valueEncoding: 'json' }),
  geometries: db => sublevel(db, 'geometries', wkb)
}


/**
 *
 */
export const transfer = (master, database) => {
  const op = ([key, value]) => ({ type: 'put', key, value })

  const sources = async sources => {
    const ops = Object.entries(sources).map(op)
    await master.batch(ops)
  }

  const projects = async projects => {

    // => master entries
    const ops = Object.entries(projects)
      .map(([id, project]) => [id, project.metadata])
      .map(op)

    ops.push(op(['legacy:transferred', true]))
    await master.batch(ops)

    // => project entries
    const projectIds = Object.keys(projects)
    for (const projectId of projectIds) {
      const { layers, preferences } = projects[projectId]
      const db = database(projectId)
      const geometries = partitions.geometries(db)
      const tuples = partitions.tuples(db)

      const layerOps = Object.entries(layers)
        .map(([layerId, { name }]) => [layerId, { name }])
        .map(op)

      const featureOps = Object.values(layers)
        .flatMap(({ features }) => Object.entries(features))
        .map(([featureId, feature]) => [featureId, { properties: feature.properties }])
        .map(op)

      const geometryOps = Object.values(layers)
        .flatMap(({ features }) => Object.entries(features))
        .map(([featureId, feature]) => [featureId, feature.geometry])
        .map(op)

      await tuples.put('property:viewport', preferences.viewport)
      await tuples.batch(layerOps)
      await tuples.batch(featureOps)
      await geometries.batch(geometryOps)
    }
  }

  return {
    sources,
    projects
  }
}
