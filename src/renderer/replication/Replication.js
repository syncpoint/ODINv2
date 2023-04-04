import React from 'react'
import { useServices } from '../components/hooks'

const STREAM_TOKEN = 'streamToken'
const CREDENTIALS = 'credentials'
const SEED = 'seed'

const Replication = () => {
  const { selection, sessionStore, store, replicationProvider } = useServices()

  const [notifications] = React.useState(new Set())
  const [replication, setReplication] = React.useState(undefined)
  const [offline, setOffline] = React.useState(true)

  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        /*
          Replication credentials are tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await sessionStore.get(CREDENTIALS)
        const replicatedProject = await replicationProvider.project(credentials)

        replicatedProject.tokenRefreshed(credentials => {
          sessionStore.put(CREDENTIALS, credentials)
        })

        /*
          seed is the projectId and the matrix room id of the project related space.
          At least the matrix room id must be persisted while joining the project.
          Since these values are non-volatile they are stored in the projectStore instead of
          the session store.
        */
        const seed = await sessionStore.get(SEED)
        await replicatedProject.hydrate(seed)
        setReplication(replicatedProject)

        const handler = {
          streamToken: streamToken => {
            sessionStore.put(STREAM_TOKEN, streamToken)
            setOffline(false)
          },
          renamed: (/* layer */) => {
            /* rename the layer accordingly */
          },
          error: error => {
            console.error(error)
            setOffline(true)
          }
        }
        const mostRecentStreamToken = await sessionStore.get(STREAM_TOKEN)
        replicatedProject.start(mostRecentStreamToken, handler)

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
      const invitations = batch.operations.filter(op => op.type === 'put' && op.key.startsWith('invited'))
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

