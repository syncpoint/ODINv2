import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Button } from './Button'
// TODO: replace Card and List with simple <div/>s
import { Input } from './Input'
import { FilterInput } from './FilterInput'
import { List } from './List'
import { Card } from './Card'
import { useList, useServices } from '../hooks'
import { militaryFormat } from '../../../shared/datetime'

/**
 *
 */
const Title = props => {
  const [value, setValue] = React.useState(props.value)
  const handleChange = ({ target }) => setValue(target.value)
  const handleBlur = () => props.onChange(value)

  // Don't let event bubble up to list.
  // This is mainly for capturing META-A (multiselect) right here.
  const handleKeyDown = event => event.stopPropagation()

  return <input
    className='card-title'
    value={value}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />
}

Title.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

/**
 *
 */
const Media = props => {
  const { loadPreview } = props
  const scale = 0.5
  const width = `${320 * scale}px`
  const height = `${240 * scale}px`
  const [source, setSource] = React.useState(undefined)

  React.useEffect(() => {
    (async () => {
      const source = await loadPreview()
      setSource(source)
    })()
  }, [loadPreview])

  const placeholder = (text = null) => (
    <div className='placeholder' style={{ width, height }}>
      { text }
    </div>
  )

  return source === undefined
    ? placeholder()
    : source === null
      ? placeholder('Preview not available')
      : <img src={source} width={width} height={height}/>
}

Media.propTypes = {
  loadPreview: PropTypes.func.isRequired
}


/**
 *
 */
const CustomButton = props => (
  <Button
    danger={props.danger}
    onClick={props.onClick}
    disabled={props.disabled}
    style={{ ...props.style, background: 'inherit' }}
  >
    {props.text}
  </Button>
)

CustomButton.propTypes = {
  danger: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object,
  text: PropTypes.string.isRequired,
  disabled: PropTypes.bool
}


/**
 *
 */
const ButtonBar = props => (
  <div style={{
    display: 'flex',
    marginTop: 'auto',
    gap: '8px'
  }}>
    {props.children}
  </div>
)

ButtonBar.propTypes = {
  children: PropTypes.array.isRequired
}

/**
 *
 */
export const ProjectList = () => {
  const { emitter, projectStore, ipcRenderer, replicationProvider } = useServices()
  const [filter, setFilter] = React.useState('')
  const [state, dispatch] = useList({ multiselect: false })

  const [replication, setReplication] = React.useState(undefined)
  const [inviteValue, setInviteValue] = React.useState({})
  const [reload, setReload] = React.useState(false)
  const [notifications] = React.useState(new Set())

  const notify = message => emitter.emit('osd', { message, cell: 'B2' })


  /**
   * Reload projects from store and update entry list
   * with optional entry id to focus.
   * Use current filter to load only projects to display in list.
   *
   * @param {*} projectId - optional project id to focus in list next.
   * @param {*} epemeralProject - An array of projects we received an invitation for, defaults to []
   */
  const fetch = React.useCallback((projectId, ephemeralProjects = []) => {
    (async () => {
      const projects = await projectStore.getProjects(filter)
      const sharedProjects = replication ? (await replication.invited()) : []

      const invitedProjects = [...sharedProjects, ...ephemeralProjects]
        .filter(project => {
          const hasAlreadyJoined = projects.includes(project.id)
          return !hasAlreadyJoined
        })
        .map(project => ({ ...project, ...{ tags: ['INVITED'] } }))

      /*  Sometimes the replication API does not update the state immediately. In order to
          avoid duplicate entries - one from the local db and one from the replication API -
          we remove these duplicate entries.
      */
      const allProjects = R.uniq([...projects, ...invitedProjects])
      dispatch({ type: 'entries', entries: allProjects, candidateId: projectId })
      if (projectId) dispatch({ type: 'select', id: projectId })
    })()
  }, [dispatch, filter, projectStore, replication])


  /**
   * Listen to store events.
   * Reload/updates projects as appropriate.
   */
  React.useEffect(() => {
    const updated = async ({ project }) => fetch(project.id)
    const created = async ({ project }) => fetch(project.id)
    const deleted = async () => fetch()

    const handlers = { updated, created, deleted }
    Object.entries(handlers).forEach(([event, handler]) => projectStore.on(event, handler))

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => projectStore.off(event, handler))
    }
  }, [projectStore, fetch])


  /**
   * Listen on project/window close event.
   * Updates projects as appropriate.
   */
  React.useEffect(() => {
    const channel = 'ipc:post:project/closed'
    const handleClosed = () => fetch()
    ipcRenderer.on(channel, handleClosed)
    return () => ipcRenderer.off(channel, handleClosed)
  }, [ipcRenderer, fetch])


  /**
   * Reload projects whenever search filter changes.
   */
  React.useEffect(fetch, [fetch])

  React.useEffect(() => {
    const initializeReplication = async () => {
      try {
        notify('Initializing replication ...')
        /*
          connect() waits endlessly
        */
        await replicationProvider.connect()
        /*
          Replication credentials are tokens that are used to authenticate the current SESSION
          to the replication server. Credentials do not contain the user's password.
        */
        const credentials = await projectStore.getCredentials('PROJECT-LIST')
        const replicatedProjectList = await replicationProvider.projectList(credentials)

        /*
          Unfortunately we have to deal with rate limiting (http error 429) at
          login. If this is our very first time we try to connect to the project it is very
          likely that we get a 429 and 'reload'' is TRUE.
          If we have no previous credentials we need to persist them before we set 'reload'
          to FALSE and re-run the effect handler.
        */
        if (!credentials) {
          const currentCredentials = replicatedProjectList.credentials()
          await projectStore.put('PROJECT-LIST', currentCredentials)
        }

        /*
          A reload my be requested due to an auth-err or a rate-limiting error.
        */
        if (reload) {
          setReload(false)
          return
        }

        replicatedProjectList.tokenRefreshed(credentials => {
          projectStore.putCredentials('PROJECT-LIST', credentials)
        })

        await replicatedProjectList.hydrate()

        const handler = {
          streamToken: streamToken => {
            projectStore.putStreamToken('PROJECT-LIST', streamToken)
            notify(null)
          },
          renamed: (/* project */) => {
            fetch()
          },
          invited: (project) => {
            const clickHandler = event => {
              event.preventDefault() // prevent the browser from focusing the Notification's tab
              event.target.onclick = undefined
              dispatch({ type: 'select', id: project.id })
              notifications.delete(event.target)
            }
            const closeHandler = event => {
              event.target.onclick = undefined
              notifications.delete(event.target)
            }

            const notification = new Notification('Received invitation', { body: project.name, data: project.id })
            notification.onclick = clickHandler
            notification.onclose = closeHandler
            notifications.add(notification)

            fetch(null, [project])
          },
          error: error => {
            console.error(error)
            notify('Replication error, trying to reestablish connection ...')
          }
        }
        const mostRecentStreamToken = await projectStore.getStreamToken('PROJECT-LIST')
        replicatedProjectList.start(mostRecentStreamToken, handler)

        setReplication(replicatedProjectList)
        notify(null)

      } catch (error) {
        console.error(error)
        notify()
        if (error.response?.status === 403) {
          await projectStore.delCredentials('PROJECT-LIST')
          notify('Credentials for replication may be void, reauthenticating ...')
          setReload(true)
        } else if (error.response?.status === 429) {
          notify('Replication was rate-limited, retrying ...')
          setReload(true)
        } else {
          notify('Replication error: ', error.message)
        }
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
  }, [reload, setOffline])

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])
  const handleCreate = () => projectStore.createProject()

  /* eslint-disable react/prop-types */
  const child = React.useCallback(props => {
    const { entry: project } = props

    const send = message => () => ipcRenderer.send(message, project.id)
    const loadPreview = () => projectStore.getPreview(project.id)
    const handleRename = name => projectStore.updateProject({ ...project, name })
    const handleDelete = () => projectStore.deleteProject(project.id)
    const handleClick = id => ({ metaKey, shiftKey }) => {
      dispatch({ type: 'click', id, shiftKey, metaKey })
    }
    const handleJoin = async () => {
      const seed = await replication.join(project.id)
      // createProject requires the id to be a UUID without prefix
      await projectStore.createProject(project.id.split(':')[1], project.name, ['SHARED'])
      await projectStore.putReplicationSeed(project.id, seed)
    }

    const handleShare = async () => {
      const seed = await replication.share(project.id, project.name, project.description || '')
      await projectStore.addTag(project.id, 'SHARED')
      await projectStore.putReplicationSeed(project.id, seed)
      fetch(project.id)
    }

    const handleInvite = value => {
      if (!value) return
      replication
        .invite(project.id, value /* [matrix] user name */)
        .then(() => console.log(`Sent invitation for project ${project.name} to ${value}`))
        .catch(error => console.error(error))
    }

    const isOpen = project.tags
      ? project.tags.includes('OPEN')
      : false

    const isInvited = project.tags
      ? project.tags.includes('INVITED')
      : false

    const isShared = project.tags
      ? project.tags.includes('SHARED')
      : false

    return (
      <div
        key={props.id}
        ref={props.ref}
        style={{ padding: '3px 6px' }}
      >
        <Card
          onClick={handleClick(props.id)}
          selected={props.selected}
          id={props.id}
        >
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div className='card-content'>
              <Title value={project.name} onChange={handleRename}/>
              <span className='card-text'>{militaryFormat.fromISO(project.lastAccess)}</span>

              <ButtonBar>
                <CustomButton onClick={send('OPEN_PROJECT')} text='Open' disabled={isInvited && !isShared}/>
                <CustomButton onClick={send('EXPORT_PROJECT')} text='Export' disabled={true}/>
                { (replication && isInvited) && <CustomButton onClick={handleJoin} text='Join' disabled={offline}/> }
                { (replication && !isInvited && !isShared && !isOpen) && <CustomButton onClick={handleShare} text='Share' disabled={offline}/> }
                { (replication && isShared) &&
                    <span style={{ display: 'flex', alignItems: 'center' }} >
                    <Input
                      style= {{ width: '25em' }}
                      placeholder='[matrix] username'
                      value={inviteValue[props.id] || ''}
                      onChange={({ target }) => {
                        const value = { ...inviteValue }
                        value[props.id] = target.value
                        setInviteValue(value)
                      }}
                      onKeyDown={event => {
                        if (event.key !== 'Enter') return
                        handleInvite(inviteValue[props.id])
                      }}
                      disabled={offline}
                    />
                    <Button
                      onClick={() => handleInvite(inviteValue[props.id])}
                      style={{ backgroundColor: '#40a9ff', color: 'white' }}
                      disabled={offline}
                    >
                        Invite
                    </Button>
                  </span>
                }
                <CustomButton
                  danger
                  onClick={handleDelete}
                  style={{ marginLeft: 'auto' }}
                  text='Delete'
                  disabled={isOpen}
                />
              </ButtonBar>
            </div>
            <Media loadPreview={loadPreview}/>
          </div>
        </Card>
      </div>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, inviteValue, ipcRenderer, offline, projectStore, replication])
  /* eslint-enable react/prop-types */

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}
    >
      { (!replicationProvider.disabled && offline) && <div style={{ display: 'flex', padding: '8px', justifyContent: 'center', backgroundColor: 'rgb(255,77,79)' }}>Replication is enabled but ODIN is OFFLINE. Trying to reconnect ...</div> }
      <div
        style={{ display: 'flex', gap: '8px', padding: '8px' }}
      >
        <FilterInput onChange={handleFilterChange} placeholder='search for projects'/>
        <Button onClick={handleCreate}>New</Button>
        <Button disabled={true}>Import</Button>
      </div>
      <List child={child} { ...state }/>
    </div>
  )
}
