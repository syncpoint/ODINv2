import React from 'react'
import PropTypes from 'prop-types'
import Members from './Members'
import Invite from './Invite'
import './ProjectList.css'
import Icon from '@mdi/react'
import { mdiAccountPlus, mdiAccountMinus, mdiAccountMultiplePlus, mdiAccountMultiple } from '@mdi/js'

const MemberManagement = props => {
  const { onClose, replication, managedProject } = props

  const ACTIONS = {
    KICK: 'kick',
    INVITE: 'invite'
  }

  const [memberList, setMemberList] = React.useState([])
  const [permissions, setPermissions] = React.useState({})
  const [action, setAction] = React.useState(ACTIONS.KICK)
  const [selected, setSelected] = React.useState([])
  const [roles, setRoles] = React.useState(undefined)

  const getMembers = async () => {
    // if (!replication) return
    const members = await replication.members(managedProject.id)
    const roles = await replication.getRoles(managedProject.id)
    const p = {
      [ACTIONS.INVITE]: ['OWNER', 'ADMINISTRATOR', 'MANAGER'].includes(roles.self),
      [ACTIONS.KICK]: ['OWNER', 'ADMINISTRATOR', 'MANAGER'].includes(roles.self)
    }

    const enhancedMembersList = members
      .filter(m => m.membership !== 'leave')
      .map(m => ({ ...m, id: m.userId, role: roles.users[m.userId] ? roles.users[m.userId] : roles.default }))

    setPermissions(p)
    setRoles(roles)
    setMemberList(enhancedMembersList)
  }

  React.useEffect(() => {
    getMembers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replication])


  const handleKick = async () => {
    try {
      await Promise.all(selected.map(userId => replication.kick(managedProject.id, userId)))
      getMembers()
    } catch (error) {
      console.error(error)
    }
  }

  const handleInvite = async () => {
    try {
      await Promise.all(selected.map(userId => replication.invite(managedProject.id, userId)))
      getMembers()
    } catch (error) {
      console.error(error)
    }
  }

  const handleRoleChange = async (event) => {
    const role = event.target.value
    console.log(`New role for ${selected[0]} will be ${role}`)
    try {
      await replication.setRole(managedProject.id, selected[0], role)
      /*
        Since the API call to getMembers() will most likely not contain the changes (not fast enaugh!) we
        do an optimistic change here.
      */
      const members = [...memberList]
      members.find(m => m.userId === selected[0]).role = role
      setMemberList(members)
    } catch (error) {
      console.error(error)
    }
  }

  const toggleView = () => {
    setAction(current => current === ACTIONS.KICK ? ACTIONS.INVITE : ACTIONS.KICK)
    setSelected([])
  }

  const changeSelection = selection => {
    if (!selection) return
    setSelected(selection)
  }

  const getCurrentView = () => {
    if (action === ACTIONS.KICK) return <Members memberlist={memberList} handleSelect={changeSelection}/>
    return <Invite replication={replication} handleSelect={changeSelection}/>
  }

  const isKickable = () => {
    if (selected.length !== 1) return false
    if (!permissions[ACTIONS.KICK]) return false
    const current = memberList.find(m => m.userId === selected[0])
    return !(['OWNER', 'ADMINISTRATOR'].includes(current?.role))
  }

  const isInvitable = () => {
    if (selected.length !== 1) return false
    if (!permissions[ACTIONS.INVITE]) return false
    const r = memberList
      .filter(m => selected.includes(m.userId))
    return r.length === 0
  }

  const defaultValue = (memberList.find(m => m.userId === selected[0]))?.role || 'NONE'
  const kickable = isKickable()
  const invitable = isInvitable()

  return (
  <div className='popup-container' onClick={() => onClose()}>
  <div className='member-container' onClick={ e => e.stopPropagation() } >
    <div className='mm-header'>
      <div className='title'>{ managedProject.name } ({roles?.self})</div>
      <button className='mm-interaction' disabled={!permissions[ACTIONS.INVITE]} onClick={toggleView}>
        <Icon size={1.7} path={action === ACTIONS.KICK ? mdiAccountMultiplePlus : mdiAccountMultiple } />
      </button>
    </div>
    <div className='mm-header'>
      { action === ACTIONS.KICK &&
        <>
          <select value={ defaultValue } onChange={handleRoleChange} disabled={!kickable} style={{ marginLeft: 'auto', marginRight: '16px', fontSize: 'larger', alignSelf: 'center' }}>
            <option value='NONE' hidden={true}></option>
            <option value='CONTRIBUTOR'>Contributor</option>
            <option value='ADMINISTRATOR'>Administrator</option>
            <option value='OWNER' disabled={true}>Owner</option>
          </select>
          <button className='mm-interaction'
            style={{ marginRight: '6px' }}
            disabled={!kickable}
            onClick={handleKick}
            >
              <Icon size={1.2} path={mdiAccountMinus} />
          </button>
        </>
      }
      {
        action === ACTIONS.INVITE &&
          <button onClick={handleInvite}
            className='mm-interaction'
            style={{ marginLeft: 'auto', marginRight: '6px' }}
            disabled={!invitable}
            >
              <Icon size={1.2} path={mdiAccountPlus} />
          </button>
      }
    </div>
    { getCurrentView() }
  </div>
</div>)
}

MemberManagement.propTypes = {
  managedProject: PropTypes.object.isRequired,
  replication: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

export default MemberManagement
