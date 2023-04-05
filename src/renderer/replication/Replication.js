import React from 'react'
import { useServices } from '../components/hooks'
import { INVITED, LAYER, isInvitedId, makeId } from '../ids'

const STREAM_TOKEN = 'replication:streamToken'
const CREDENTIALS = 'replication:credentials'
const SEED = 'replication:seed'

const Replication = () => {
  const { emitter, selection, sessionStore, store, replicationProvider } = useServices()

  const [notifications] = React.useState(new Set())
  const [replication, setReplication] = React.useState(undefined)
  const [offline, setOffline] = React.useState(true)

  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        /* const sessionKeys = await sessionStore.keys()
        console.dir(sessionKeys) */

        /*
          Replication credentials are tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await sessionStore.get(CREDENTIALS, null)
        const replicatedProject = await replicationProvider.project(credentials)

        replicatedProject.tokenRefreshed(credentials => {
          sessionStore.put(CREDENTIALS, credentials)
        })

        /*
          seed is the projectId and the matrix room id of the project related space.
          At least the matrix room id must be persisted while joining the project.
        */

        const seed = await sessionStore.get(SEED)
        const projectDescription = await replicatedProject.hydrate(seed)

        const allInvitations = await store.keys(INVITED)
        const invitations = projectDescription.invitations
          .filter(invitation => (!allInvitations.includes(makeId(INVITED, invitation.id))))
          .map(invitation => ([
            makeId(INVITED, invitation.id),
            {
              name: invitation.name,
              description: invitation.topic
            }
          ]))

        await store.insert(invitations)

        emitter.on('replication/:action/:id', async ({ action, id }) => {
          // TODO: replace with RAMDA function
          if (action === 'join') {
            const layer = await replicatedProject.joinLayer(id.split(':')[1])
            console.dir(layer)
            await store.insert([[makeId(LAYER, layer.id), {
              name: layer.name,
              description: layer.topic,
              tags: ['SHARED']
            }]])
            await store.delete(id)
          } /* else if (action === 'share') {

          } */
        })

        const handler = {
          streamToken: streamToken => {
            console.log(`PERSISTING STREAM_TOKEN: ${streamToken}`)
            sessionStore.put(STREAM_TOKEN, streamToken)
            if (offline) setOffline(false)
          },
          renamed: (/* layer */) => {
            /* rename the layer accordingly */
          },
          error: error => {
            console.error(error)
            setOffline(true)
          }
        }
        const mostRecentStreamToken = await sessionStore.get(STREAM_TOKEN, null)
        replicatedProject.start(mostRecentStreamToken, handler)

        setReplication(replicatedProject)

      } catch (error) {
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
  }, [])



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
      const invitations = batch.operations.filter(op => op.type === 'put' && isInvitedId(op.key))
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

