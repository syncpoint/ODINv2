import path from 'path'
import fs from 'fs'
import level from 'level'
import sublevel from 'subleveldown'
import { wkb } from '../shared/encoding'
import { evented, EVENT } from './evented'
import * as L from '../shared/level'


/**
 * Database must not be opened on module load time, because second process
 * will crash at this point. LevelDB supports only one process
 * holding a database lock.
 */
let db


/**
 *
 */
export const open = directory => {
  const databases = path.join(directory, 'databases')
  const filename = path.join(databases, 'master')
  fs.mkdirSync(databases, { recursive: true })
  db = level(filename, { valueEncoding: 'json' })
  evented.on(EVENT.QUIT, () => db.close())
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


export const transferred = async (master = db) =>
  L.get(master, 'legacy:transferred', false)


/**
 *
 */
export const transfer = (database, master = db) => {
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

      // Note: Caller in (main process) is expected to close
      // project database after transfer.
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

      await tuples.put('session:viewport', preferences.viewport)
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

export const projectList = async (master = db) => {
  const projects = await L.aggregate(master, 'project:')
  const byLastAccess = (a, b) => b.lastAccess.localeCompare(a.lastAccess)
  return Object.entries(projects).reduce((acc, [id, project]) => {
    return acc.concat({ id: `project:${id}`, ...project })
  }, []).sort(byLastAccess)
}

const get = async (db, key) => {
  try {
    return await db.get(key)
  } catch (err) {
    console.log(err)
  }
}
export const project = (id, master = db) => get(master, id)

export const updateEntry = (id, fn, master = db) => L.update(master, id, fn)

export const updateBounds = (projectId, bounds, master = db) => {
  L.update(master, projectId, project => ({
    ...project,
    ...bounds
  }))
}
