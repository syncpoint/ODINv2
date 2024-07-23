import React from 'react'
import { useServices } from '../components/hooks'
import * as ID from '../ids'
import uuid from '../../shared/uuid'

import { KEYS, rolesReducer } from './shared'
import storeHandler from './handler/store'
import toolbarHandler from './handler/toolbar'
import upstreamHandler from './handler/upstream'

const CREATOR_ID = uuid()

const Replication = () => {
  /*
    Using the signal 'replication/operational' is a way to communicate the current state of the replication
    to other components of the application. I.e. if replication is not operational some buttons in the
    replication toolbar are disabled.
  */
  const { emitter, ipcRenderer, preferencesStore, selection, sessionStore, signals, store, replicationProvider } = useServices()

  /* system/OS level notifications */
  const notifications = React.useRef(new Set())

  const abortController = React.useRef(new AbortController())
  const [initialized, setInitialized] = React.useState(false)
  const [offline, setOffline] = React.useState(false)

  const feedback = message => emitter.emit('osd', { message, cell: 'B2' })

  React.useEffect(() => {
    if (!initialized) return

    const reconnect = async () => {
      try {
        feedback('Looks like we are offline! Reconnecting ...')
        signals['replication/operational'](false)
        abortController.current = new AbortController()
        await replicationProvider.connect(abortController.current)
        setOffline(false)
        feedback(null)
        signals['replication/operational'](true)
      } catch (error) {
        // issued by abortController
        if (error === 'online') {
          setOffline(false)
          feedback(null)
          signals['replication/operational'](true)
          return
        }
        console.error(error)
        feedback(error.message)
        setOffline(true)
      }
    }
    reconnect()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, offline])

  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        feedback('Initializing replication ...')
        /*
          Replication credentials are (access, refresh) tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await sessionStore.get(KEYS.CREDENTIALS, null)
        const replicatedProject = await replicationProvider.project(credentials)

        if (!credentials) {
          const currentCredentials = replicatedProject.credentials()
          await sessionStore.put(KEYS.CREDENTIALS, currentCredentials)
        }

        /*
          Whenever an access and a refresh token are renewed we store/update them
          for the next time the replication is started.
        */
        replicatedProject.tokenRefreshed(credentials => {
          sessionStore.put(KEYS.CREDENTIALS, credentials)
        })

        /*
          Seed is the projectId and the matrix room id of the project related space.
          At least the matrix room id must be persisted while joining the project.
          See project-list where this is done.
        */
        const seed = await sessionStore.get(KEYS.SEED)

        /*
          connect() waits 'till infinity
        */
        await replicationProvider.connect()
        const projectDescription = await replicatedProject.hydrate(seed)
        /*
          Iterate over all layers and check the permissions. if our role is READER, restrict the layers. Otherwise, permit them.
        */
        const permissions = projectDescription.layers.reduce(rolesReducer, { restrict: [], permit: [] })
        if (permissions.restrict.length > 0) await store.restrict(permissions.restrict)
        if (permissions.permit.length > 0) await store.permit(permissions.permit)

        const roles = projectDescription.layers.map(l => ({ type: 'put', key: ID.roleId(l.id), value: l.role }))
        await store.import(roles, { creatorId: CREATOR_ID })

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
        emitter.on('replication/:action/:id/:parameter', toolbarHandler({ replicatedProject, store, CREATOR_ID }))
        /*
          Handle events emitted by the local store.
        */
        store.on('batch', storeHandler({ replicatedProject, store, CREATOR_ID }))

        window.addEventListener('online', () => {
          console.log('Browser thinks we are back online. Let\'s give it a try ...')
          abortController.current.abort('online')
        })

        /*
          Start the timeline sync process with the most recent stream token
        */
        const mostRecentStreamToken = await sessionStore.get(KEYS.STREAM_TOKEN, null)
        replicatedProject.start(mostRecentStreamToken, upstreamHandler({ sessionStore, setOffline, store, CREATOR_ID }))
        feedback(null)
        signals['replication/operational'](true)
        setInitialized(true)

      } catch (error) {
        console.error(error)
        setOffline(true)
        feedback('Replication error: ', error.message)
        await sessionStore.del(KEYS.CREDENTIALS, null)
        ipcRenderer.postMessage('RELOAD_ALL_WINDOWS')
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

