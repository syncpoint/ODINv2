import React from 'react'
import { useServices } from '../components/hooks'
import * as ID from '../ids'
import uuid from 'uuid-random'


const STREAM_TOKEN = 'replication:streamToken'
const CREDENTIALS = 'replication:credentials'
const SEED = 'replication:seed'
const CREATOR_ID = uuid()

const Replication = () => {
  /*
    Using the signal 'replication/operational' is a way to communicate the current state of the replication
    to other components of the application. I.e. if replication is not operational some buttons in the
    replication toolbar are disabled.
  */
  const { emitter, preferencesStore, selection, sessionStore, signals, store, replicationProvider } = useServices()

  /* system/OS level notifications */
  const notifications = React.useRef(new Set())
  const [reload, setReload] = React.useState(false)

  const feedback = message => emitter.emit('osd', { message, cell: 'B2' })

  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        feedback('Initializing replication ...')
        /*
          Replication credentials are (access, refresh) tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await sessionStore.get(CREDENTIALS, null)
        const replicatedProject = await replicationProvider.project(credentials)
        /*
          Unfortunately we have to deal with rate limiting (http error 429) at
          login. If this is our very first time we try to connect to the project it is very
          likely that we get a 429 and 'reload' is TRUE.
          If we have no previous credentials we need to persist them before we set 'reload'
          to FALSE and re-run the effect handler.
        */
        if (!credentials) {
          const currentCredentials = replicatedProject.credentials()
          await sessionStore.put(CREDENTIALS, currentCredentials)
        }

        if (reload) {
          console.log('ReAuthentication has been triggererd. ')
          setReload(false)
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

        /*
          connect() waits 'till infinity
        */
        await replicationProvider.connect()
        const projectDescription = await replicatedProject.hydrate(seed)

        /*
          On startup we import all invitations we already know about.
          18apr23: We need to check if this is still required because we may receive the invitations via the upstream handler.
        */
        const allInvitations = await store.keys(ID.INVITED)
        const invitations = projectDescription.invitations
          .filter(invitation => (!allInvitations.includes(ID.makeId(ID.INVITED, invitation.id))))
          .map(invitation => ([{ type: 'put', key: ID.makeId(ID.INVITED, invitation.id), value: { name: invitation.name, description: invitation.topic } }]))
          .flat()
        await store.import(invitations, { creatorId: CREATOR_ID })

        /*
          Handler toolbar commands for for sharing and joining layers
        */
        emitter.on('replication/:action/:id', async ({ action, id }) => {
          switch (action) {
            case 'join': {
              /* id looks like invited+THE_ID. So we need to remove the prefix. */
              const layerId = id.replace('invited:', '')
              const layer = await replicatedProject.joinLayer(layerId)
              await store.import([
                { type: 'put', key: layer.id, value: { name: layer.name, description: layer.topic } },
                { type: 'put', key: ID.sharedId(layer.id), value: true }
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
              break
            }
            case 'share': {
              const { name } = await store.value(id)
              await replicatedProject.shareLayer(id, name)
              await store.import([{ type: 'put', key: ID.sharedId(id), value: true }], { creatorId: CREATOR_ID })

              /* post initial content of the layer */
              const keys = await store.collectKeys([id], [ID.STYLE, ID.LINK, ID.TAGS, ID.FEATURE])
              const tuples = await store.tuples(keys)
              const operations = tuples.map(([key, value]) => ({ type: 'put', key, value }))
              replicatedProject.post(id, operations)
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
            feedback(null)
            signals['replication/operational'](true)
          },
          invited: async (invitation) => {
            const content = { type: 'put', key: ID.makeId(ID.INVITED, invitation.id), value: { name: invitation.name, description: invitation.topic } }
            await store.import([content], { creatorId: CREATOR_ID })
          },
          received: async (operations) => {
            await store.import(operations, { creatorId: CREATOR_ID })
          },
          renamed: async (renamed) => {
            /*
              Since we must monitor the project itself for child added events we also may receive
              renamed events regarding the project. We ignore these for now.
            */
            const ops = renamed
              .filter(target => ID.isLayerId(target.id))
              .map(layer => ({ type: 'put', key: layer.id, value: { name: layer.name } }))
            await store.import(ops, { creatorId: CREATOR_ID })
          },
          error: async (error) => {
            console.dir(error)
            if (!navigator.onLine) {
              feedback('Looks like we are offline! Reconnecting ...')
            } else {
              feedback('Replication error! Reconnecting ...')
            }
            signals['replication/operational'](false)
          }
        }

        /*
          Start the timeline sync process with the most recent stream token
        */
        const mostRecentStreamToken = await sessionStore.get(STREAM_TOKEN, null)
        replicatedProject.start(mostRecentStreamToken, upstreamHandler)
        feedback(null)
        signals['replication/operational'](true)
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
            return ops.filter(op => sharedLayers.includes(ID.layerId(ID.containerId(op.key))))
          }

          const structuralOperations = await sharedLayersOnly(operations.filter(op => ID.isLayerId(op.key)))
          /* LAYER RENAMED */
          structuralOperations
            .filter(op => op.type === 'put')
            .map(op => ({ id: op.key, name: op.value.name }))
            .forEach(op => replicatedProject.setLayerName(op.id, op.name))

          /* LAYER REMOVED so the original layer does not exist anymore. Thus, we need to filter for the "shared+layer:" key */
          /* TODO: If we remove a shared layer, should we create a new invitation? */
          operations.filter(op => ID.isSharedLayerId(op.key))
            .filter(op => op.type === 'del')
            .map(op => ID.containerId(op.key))
            .forEach(id => replicatedProject.leaveLayer(id))

          /* TODO: Deleting a layer is UNDOable! How dow we support re-joining after undo? */

          const predicates = [
            ID.isFeatureId,
            ID.isLinkId,
            ID.isTagsId,
            ID.isStyleId
          ]
          const operationsToBeReplicated = operations.filter(op => predicates.some(test => test(op.key)))

          const sharedContent = await sharedLayersOnly(operationsToBeReplicated)
          if (sharedContent.length) {
            console.dir(sharedContent)

            const operationsByLayer = sharedContent
              .filter(op => op !== null)
              .reduce((acc, op) => {
                const layerId = ID.layerId(ID.containerId(op.key))
                acc[layerId] = acc[layerId] || []
                acc[layerId].push(op)
                return acc
              }, {})

            Object.entries(operationsByLayer)
              .forEach(([layerId, operations]) => replicatedProject.post(layerId, operations))
          }

        })


      } catch (error) {
        if (error.response?.status === 403) {
          await sessionStore.del(CREDENTIALS)
          feedback('Credentials for replication may be void, reauthenticating ...')
          setReload(true)
        } else if (error.response?.status === 429) {
          feedback('Replication was rate-limited, retrying ...')
          setReload(true)
        } else if (!navigator.onLine) {
          feedback('Looks like we are offline! Reconnecting ...')
        } else {
          feedback('Replication error!', error.message)
        }
        console.dir(error)
        signals['replication/operational'](false)
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
  }, [reload])


  /*
    When we receive an invitation for a new layer we use to OS notification
    system to inform the user. The user may either dismiss the notification (close)
    or click on it. The latter switches to the @invited scope and allows joining
    the layer.
  */
  React.useEffect(() => {

    const clickHandler = event => {
      event.preventDefault() // prevent the browser from focusing the Notification's tab
      event.target.onclick = undefined
      notifications.current.delete(event.target)
      preferencesStore.showSidebar(true)
      setTimeout(() => selection.focus(event.target.data), 250)
    }

    const closeHandler = event => {
      event.target.onclick = undefined
      notifications.current.delete(event.target)
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
        notifications.current.add(notification)
      })
    }
    store.on('batch', handler)

    return () => {
      store.off('batch', handler)
      notifications.current.clear()
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [])
}

export {
  Replication
}

