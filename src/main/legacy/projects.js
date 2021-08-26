import * as io from './io'


/**
 * Read all legacy projects with metadata, preferences and layers/features.
 *
 * [project UUID -> project]
 * project: {
 *   layers,
 *   links,
 *   metadata,
 *   preferences
 * }
 */
export const readProjects = async location => {
  const uuids = await io.readProjects(location)

  return uuids.reduce(async (acc, uuid) => {
    const layerNames = await io.readLayers(location, uuid)
    const [layers, links] = await layerNames.reduce(async (acc, layer) => {
      const { id, features, links } = await io.readLayer(location, uuid, layer)
      const [layerList, linkList] = await acc
      layerList.push({ id, name: layer, features })
      linkList.push(...links)
      return acc
    }, [[], []])

    const projects = await acc
    projects.push({
      id: `project:${uuid}`,
      layers,
      links,
      metadata: await io.readMetadata(location, uuid),
      preferences: await io.readPreferences(location, uuid)
    })

    return projects
  }, [])
}
