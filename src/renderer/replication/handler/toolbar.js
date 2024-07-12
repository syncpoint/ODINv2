import * as ID from '../../ids'

export default ({ store, replicatedProject, CREATOR_ID }) => {
  return async ({ action, id, parameter }) => {
    switch (action) {
      case 'join': {
        /* id looks like invited+THE_ID. So we need to remove the prefix. */
        const layerId = id.replace('invited:', '')
        const layer = await replicatedProject.joinLayer(layerId)
        await store.import([
          { type: 'put', key: layer.id, value: { name: layer.name, description: layer.topic } },
          { type: 'put', key: ID.sharedId(layer.id), value: true },
          { type: 'put', key: ID.roleId(layer.id), value: layer.role }
        ], { creatorId: CREATOR_ID })
        await store.delete(id) // invitation ID
        /*
          We load the entire existing content. This may be huge, especially
          if you join long running rooms. Unless we have a solid solution
          for managing snapshots: this is the way.
        */
        const operations = await replicatedProject.content(layer.id)
        console.log(`Initial sync has ${operations.length} operations`)
        await store.import(operations, { creatorId: CREATOR_ID })
        // TODO: check the powerlevel and apply restrictions if required
        break
      }
      case 'share': {
        const { name } = await store.value(id)
        const layer = await replicatedProject.shareLayer(id, name)
        await store.import([
          { type: 'put', key: ID.sharedId(id), value: true },
          { type: 'put', key: ID.roleId(id), value: layer.role }
        ], { creatorId: CREATOR_ID })

        /* post initial content of the layer */
        const keys = await store.collectKeys([id], [ID.STYLE, ID.LINK, ID.TAGS, ID.FEATURE])
        const tuples = await store.tuples(keys)
        const operations = tuples.map(([key, value]) => ({ type: 'put', key, value }))
        replicatedProject.post(id, operations)
        break
      }
      case 'leave': {
        const reJoinOffer = await replicatedProject.leaveLayer(id)

        const replicatedKeys = await store.collectKeys([id], [ID.SHARED, ID.ROLE, ID.RESTRICTED])
        await store.import(replicatedKeys.map(key => ({ type: 'del', key })))

        /* since the layer is not shared anymore this bacth does not trigger replication */
        const layerKeys = await store.collectKeys([id], [ID.LINK, ID.HIDDEN, ID.TAGS, ID.FEATURE, ID.STYLE])
        await store.import(layerKeys.map(key => ({ type: 'del', key })))

        const candidate = { type: 'put', key: ID.makeId(ID.INVITED, reJoinOffer.id), value: { name: reJoinOffer.name, description: reJoinOffer.topic } }
        await store.import([candidate])

        break
      }
      case 'changeDefaultRole': {
        await replicatedProject.setDefaultRole(id, parameter)
        break
      }
      default: {
        console.log(`Unhandled action ${action}`)
      }
    }
  }
}
