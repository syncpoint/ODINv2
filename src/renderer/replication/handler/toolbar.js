import * as ID from '../../ids'
import { rolesReducer } from '../shared'

/**
 * Import operations into the store, respecting layer restrictions.
 * Used by both the initial content load (join) and the stream handler (received).
 */
const importOperations = async (store, id, operations, CREATOR_ID) => {
  const [restricted] = await store.collect(id, [ID.restrictedId])
  await store.import(operations, { creatorId: CREATOR_ID })
  if (restricted) {
    const operationKeys = operations.map(o => o.key)
    await store.restrict(operationKeys)
  }
}

export { importOperations }

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
          Load the entire existing content. The join HTTP call is synchronous —
          once it returns 200, the messages endpoint should have the content.
        */
        // Apply layer restrictions based on the user's role
        const permissions = [layer].reduce(rolesReducer, { restrict: [], permit: [] })
        if (permissions.restrict.length > 0) await store.restrict(permissions.restrict)
        if (permissions.permit.length > 0) await store.permit(permissions.permit)

        // When E2EE is active, historical keys arrive via the sync stream's
        // to_device events (receiveSyncChanges → importRoomKeys). The stream
        // runs in parallel, so we need to give it time to process the keys
        // before attempting to decrypt content.
        if (replicatedProject.cryptoManager) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Load and import initial content (respects layer restrictions)
        const operations = await replicatedProject.content(layer.id)
        console.log(`Initial sync has ${operations.length} operations`)
        await importOperations(store, layer.id, operations, CREATOR_ID)
        break
      }
      case 'share': {
        const { name } = await store.value(id)
        // Inherit encryption setting from the project (set during handleShare in ProjectList)
        const cryptoEnabled = replicatedProject.cryptoManager !== null
        const layer = await replicatedProject.shareLayer(id, name, '', { encrypted: cryptoEnabled })
        if (!layer) {
          console.log('layer is already shared')
          return
        }
        await store.import([
          { type: 'put', key: ID.sharedId(id), value: true },
          { type: 'put', key: ID.roleId(id), value: layer.role }
        ], { creatorId: CREATOR_ID })

        /* post initial content of the layer */
        const keys = await store.collectKeys([id], [ID.STYLE, ID.LINK, ID.TAGS, ID.FEATURE])
        const tuples = await store.tuples(keys)
        const operations = tuples.map(([key, value]) => ({ type: 'put', key, value }))
        await replicatedProject.post(id, operations)

        /* Share Megolm session keys with all project members so they can
           decrypt this layer's content even if they join later (offline). */
        await replicatedProject.shareHistoricalKeys(id)
        break
      }
      case 'leave': {
        const reJoinOffer = await replicatedProject.leaveLayer(id)

        const replicatedKeys = await store.collectKeys([id], [ID.SHARED, ID.ROLE, ID.RESTRICTED])
        await store.import(replicatedKeys.map(key => ({ type: 'del', key })))

        /* since the layer is not shared anymore this bacth does not trigger replication */
        const layerKeys = await store.collectKeys([id], [ID.LINK, ID.HIDDEN, ID.TAGS, ID.FEATURE, ID.STYLE, ID.DEFAULT])
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
