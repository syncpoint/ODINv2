import * as io from './io'


/**
 * Read all legacy projects with metadata, preferences and layers/features.
 *
 * [project UUID -> project]
 * project: {
 *   layers,
 *   metadata,
 *   preferences
 * }
 */
export const readProjects = async location => {
  const uuids = await io.readProjects(location)

  return uuids.reduce(async (acc, uuid) => {
    const layerNames = await io.readLayers(location, uuid)
    const layers = layerNames.reduce(async (acc, layer) => {
      const { id, features } = await io.readLayer(location, uuid, layer)
      const layers = await acc
      layers.push({ id, name: layer, features })
      return layers
    }, [])

    const projects = await acc
    projects.push({
      id: `project:${uuid}`,
      layers: await layers,
      metadata: await io.readMetadata(location, uuid),
      preferences: await io.readPreferences(location, uuid)
    })

    return projects
  }, [])
}
