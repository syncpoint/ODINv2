import React from 'react'
import { useServices } from '../components/hooks'
import * as ID from '../ids'
import uuid from 'uuid-random'


const STREAM_TOKEN = 'replication:streamToken'
const CREDENTIALS = 'replication:credentials'
const SEED = 'replication:seed'
const CREATOR_ID = uuid()

const Replication = () => {
  const { emitter, selection, sessionStore, store, replicationProvider } = useServices()

  const [notifications] = React.useState(new Set())
  const [offline, setOffline] = React.useState(true)
  const [reAuthenticate, setReAuthenticate] = React.useState(false)


  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        console.log('Initializing replication')
        /*
          Replication credentials are (access, refresh) tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await sessionStore.get(CREDENTIALS, null)
        const replicatedProject = await replicationProvider.project(credentials)
        if (reAuthenticate) {
          console.log('ReAuthentication has been triggererd. ')
          setReAuthenticate(false)
          return
        }

        /*
          Whenever a access and a refresh token a renewed we store/update them
          for the next time the replication is started.
        */
        replicatedProject.tokenRefreshed(credentials => {
          sessionStore.put(CREDENTIALS, credentials)
        })

        /*
          Seed is the projectId and the matrix room id of the project related space.
          At least the matrix room id must be persisted while joining the project.
          See project-list where this is done.
        */
        const seed = await sessionStore.get(SEED)
        const projectDescription = await replicatedProject.hydrate(seed)

        /*
          On startup we import all invitations we already know about.
          18apr23: We need to check if this is still required because we may receive the invitations via the upstream handler.
        */
        const allInvitations = await store.keys(ID.INVITED)
        const invitations = projectDescription.invitations
          .filter(invitation => (!allInvitations.includes(ID.makeId(ID.INVITED, invitation.id))))
          .map(invitation => ([{ type: 'put', key: ID.makeId(ID.INVITED, invitation.id), value: { name: invitation.name, description: invitation.topic } }]))
        await store.import(invitations, { creatorId: CREATOR_ID })

        /*
          Handler toolbar commands for for sharing and joining layers
        */
        emitter.on('replication/:action/:id', async ({ action, id }) => {
          switch (action) {
            case 'join': {
              const layer = await replicatedProject.joinLayer(id.split(':')[1])
              const key = ID.makeId(ID.LAYER, layer.id)
              await store.import([
                { type: 'put', key, value: { name: layer.name, description: layer.topic, tags: ['SHARED'] } },
                { type: 'put', key: ID.sharedId(key), value: true }
              ], { creatorId: CREATOR_ID })
              await store.delete(id) // invitation ID
              break
            }
            case 'share': {
              const { name } = await store.value(id)
              const uuid = ID.layerUUID(id)
              await replicatedProject.shareLayer(uuid, name)
              await store.import([{ type: 'put', key: ID.sharedId(id), value: true }], { creatorId: CREATOR_ID })
              await store.addTag(id, 'SHARED')

              // TODO publish content
              break
            }
          }
        })

        /*
          Handling upstream events triggered by the timeline API
        */
        const upstreamHandler = {
          streamToken: async (streamToken) => {
            console.log(`PERSISTING STREAM_TOKEN: ${streamToken}`)
            sessionStore.put(STREAM_TOKEN, streamToken)
            if (offline) setOffline(false)
          },
          invited: async (invitation) => {
            const content = { type: 'put', key: ID.makeId(ID.INVITED, invitation.id), value: { name: invitation.name, description: invitation.topic } }
            await store.import([content], { creatorId: CREATOR_ID })
          },
          received: async (operations) => {
            await store.import(operations, { creatorId: CREATOR_ID })
          },
          renamed: async (renamed) => {
            const ops = renamed.map(layer => ({ type: 'put', key: ID.makeId(ID.LAYER, layer.id), value: { name: layer.name } }))
            await store.import(ops, { creatorId: CREATOR_ID })
          },
          error: async (error) => {
            /* TODO: error handling:
                #offline
                #auth_failed
            */
            console.error(error)
          }
        }

        /*
          Start the timeline sync process with the most recent stream token
        */
        const mostRecentStreamToken = await sessionStore.get(STREAM_TOKEN, null)
        replicatedProject.start(mostRecentStreamToken, upstreamHandler)

        /*
          Handle events emitted by the local store.
        */
        store.on('batch', async ({ operations, creatorId }) => {
          if (CREATOR_ID === creatorId) return
          console.dir(operations)

          /* helper */
          const sharedLayerIDs = async () => {
            const keys = await store.keys('shared+layer:')
            return store.tuples(keys.map(key => ID.layerId(key)))
          }

          const sharedLayersOnly = async (ops) => {
            const sharedLayers = (await sharedLayerIDs()).map(([key]) => key)
            return ops.filter(op => sharedLayers.includes(ID.layerId(op.key)))
          }

          const structuralOperations = await sharedLayersOnly(operations.filter(op => ID.isLayerId(op.key)))
          /* LAYER RENAMED */
          structuralOperations
            .filter(op => op.type === 'put')
            .map(op => ({ id: ID.layerUUID(op.key), name: op.value.name }))
            .forEach(op => replicatedProject.setLayerName(op.id, op.name))

          /* LAYER REMOVED so the original layer does not exist anymore. Thus, we need to filter for the "shared+layer:" key */
          /* TODO: If we remove a shared layer, should we create a new invitation? */
          operations.filter(op => ID.isSharedLayerId(op.key))
            .filter(op => op.type === 'del')
            .map(op => op.key.replace('shared+layer:', ''))
            .forEach(id => replicatedProject.leaveLayer(id))

          /* TODO: Deleting a layer is UNDOable! How dow we support re-joining after undo? */

          const predicates = [
            ID.isFeatureId,
            ID.isLinkId,
            ID.isTagsId,
            ID.isStyleId
          ]
          const sharedContent = await sharedLayersOnly(operations.filter(op => predicates.some(test => test(op.key))))
          if (sharedContent.length) {
            console.dir(sharedContent)

            const operationsByLayer = sharedContent
              .filter(op => op !== null)
              .reduce((acc, op) => {
                const layerId = ID.layerUUID(op.key)
                acc[layerId] = acc[layerId] || []
                acc[layerId].push(op)
                return acc
              }, {})

            Object.entries(operationsByLayer)
              .forEach(([layerId, operations]) => replicatedProject.post(layerId, operations))
          }

        })


      } catch (error) {
        setOffline(true)
        if (error.response?.status === 403) {
          await sessionStore.del(CREDENTIALS)
          setReAuthenticate(true)
        }
        console.error(error)
      }
    }

    if (replicationProvider.disabled) {
      console.log('Replication is disabled')
      return
    }
    initializeReplication()

    /*
      Returning a cleanup function from this top-level component does not make sense. The window
      gets closed but react does not execute the cleanup function.
      Even subscribing to the appropriate window event (beforeunload) does not work in order to
      logout from the replication server.
    */

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reAuthenticate])



  React.useEffect(() => {

    const clickHandler = event => {
      event.preventDefault() // prevent the browser from focusing the Notification's tab
      event.target.onclick = undefined
      notifications.delete(event.target)
      selection.focus(event.target.data)
      console.log('CLICK')
    }

    const closeHandler = event => {
      event.target.onclick = undefined
      notifications.delete(event.target)
    }

    const handler = batch => {
      const invitations = batch.operations.filter(op => op.type === 'put' && ID.isInvitedId(op.key))
      invitations.forEach(invitation => {
        const options = {
          body: invitation.value.name,
          data: invitation.key
        }
        const notification = new Notification('Received invitation', options)
        notification.onclick = clickHandler
        notification.onclose = closeHandler
        notifications.add(notification)
      })
    }
    store.on('batch', handler)

    return () => {
      store.off('batch', handler)
      notifications.clear()
    }
  }, [notifications, store, selection])
}

export {
  Replication
}

