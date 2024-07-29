import * as ID from '../../ids'
import { KEYS, rolesReducer } from '../shared'

export default ({ sessionStore, setOffline, store, CREATOR_ID }) => {
  /*
    Handling upstream events triggered by the timeline API
  */
  return {
    streamToken: async (streamToken) => {
      console.log(`PERSISTING STREAM_TOKEN: ${streamToken}`)
      sessionStore.put(KEYS.STREAM_TOKEN, streamToken)
      setOffline(false)
    },
    invited: async (invitation) => {
      const content = { type: 'put', key: ID.makeId(ID.INVITED, invitation.id), value: { name: invitation.name, description: invitation.topic } }
      await store.import([content], { creatorId: CREATOR_ID })
    },
    received: async ({ id, operations }) => {
      const [restricted] = await store.collect(id, [ID.restrictedId])
      await store.import(operations, { creatorId: CREATOR_ID })
      if (restricted) {
        const operationKeys = operations.map(o => o.key)
        await store.restrict(operationKeys)
      }
    },
    renamed: async (renamed) => {
      /*
        Since we must monitor the project itself for child added events we
        also may receive renamed events regarding the project.
        We ignore these for now.
      */
      const ops = renamed
        .filter(target => ID.isLayerId(target.id))
        .map(layer => ({ type: 'put', key: layer.id, value: { name: layer.name } }))
      await store.import(ops, { creatorId: CREATOR_ID })
    },
    roleChanged: async (roles) => {
      const permissions = roles.reduce(rolesReducer, { permit: [], restrict: [] })
      if (permissions.permit.length > 0) await store.permit(permissions.permit)
      if (permissions.restrict.length > 0) await store.restrict(permissions.restrict)
      const rolesOperations = roles.map(l => ({ type: 'put', key: ID.roleId(l.id), value: l.role }))
      await store.import(rolesOperations, { creatorId: CREATOR_ID })
    },
    error: async (error) => {
      console.error(error)
      setOffline(true)
    }
  }
}
