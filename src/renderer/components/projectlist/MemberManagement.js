import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from 'react-tooltip'
import Members from './Members'
import Invite from './Invite'
import Icon from '@mdi/react'
import { mdiAccountPlus, mdiAccountMinus, mdiAccountMultiplePlus, mdiAccountMultiple } from '@mdi/js'
import './MemberManagement.css'

const ACTIONS = {
  KICK: 'kick',
  INVITE: 'invite'
}

const MemberManagement = ({ onClose, replication, managedProject }) => {
  const [memberList, setMemberList] = React.useState([])
  const [permissions, setPermissions] = React.useState({})
  const [action, setAction] = React.useState(ACTIONS.KICK)
  const [selected, setSelected] = React.useState([])
  const [roles, setRoles] = React.useState(undefined)

  const getMembers = React.useCallback(async () => {
    const members = await replication.members(managedProject.id)
    const roles = await replication.getRoles(managedProject.id)

    const canManage = ['OWNER', 'ADMINISTRATOR', 'MANAGER'].includes(roles.self)
    setPermissions({
      [ACTIONS.INVITE]: canManage,
      [ACTIONS.KICK]: canManage
    })
    setRoles(roles)
    setMemberList(
      members
        .filter(m => m.membership !== 'leave')
        .map(m => ({
          ...m,
          id: m.userId,
          role: roles.users[m.userId] || roles.default
        }))
    )
  }, [replication, managedProject.id])

  React.useEffect(() => {
    getMembers()
  }, [getMembers])

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
    try {
      await replication.setRole(managedProject.id, selected[0], role)
      setMemberList(prev => prev.map(m =>
        m.userId === selected[0] ? { ...m, role } : m
      ))
    } catch (error) {
      console.error(error)
    }
  }

  const toggleView = () => {
    setAction(current => current === ACTIONS.KICK ? ACTIONS.INVITE : ACTIONS.KICK)
    setSelected([])
  }

  const changeSelection = React.useCallback(selection => {
    if (selection) setSelected(selection)
  }, [])

  const kickable = React.useMemo(() => {
    if (selected.length !== 1 || !permissions[ACTIONS.KICK]) return false
    const current = memberList.find(m => m.userId === selected[0])
    return !['OWNER', 'ADMINISTRATOR'].includes(current?.role)
  }, [selected, permissions, memberList])

  const invitable = React.useMemo(() => {
    if (selected.length !== 1 || !permissions[ACTIONS.INVITE]) return false
    return !memberList.some(m => selected.includes(m.userId))
  }, [selected, permissions, memberList])

  const selectedRole = memberList.find(m => m.userId === selected[0])?.role || ''

  return (
    <div className='mm-overlay' onClick={onClose}>
      <div className='mm-panel' onClick={e => e.stopPropagation()}>

        {/* Header: project name + view toggle */}
        <div className='mm-toolbar'>
          <div className='mm-title'>
            {managedProject.name}
            {roles?.self && <span className='mm-self-role'>{roles.self}</span>}
          </div>
          <button
            className='mm-btn'
            disabled={!permissions[ACTIONS.INVITE]}
            onClick={toggleView}
            id='mm-toggle-view'
          >
            <Icon size={0.8} path={action === ACTIONS.KICK ? mdiAccountMultiplePlus : mdiAccountMultiple} />
          </button>
          <Tooltip anchorSelect='#mm-toggle-view' content={action === ACTIONS.KICK ? 'Add members' : 'Show members'} style={{ zIndex: 200 }} delayShow={750} />
        </div>

        {/* Actions bar */}
        <div className='mm-actions'>
          {action === ACTIONS.KICK && (
            <>
              <select
                className='mm-role-select'
                value={selectedRole}
                onChange={handleRoleChange}
                disabled={!kickable}
                id='mm-change-role'
              >
                <option value='' hidden></option>
                <option value='CONTRIBUTOR'>Contributor</option>
                <option value='ADMINISTRATOR'>Administrator</option>
                <option value='OWNER' disabled>Owner</option>
              </select>
              <button
                className='mm-btn mm-btn--danger'
                disabled={!kickable}
                onClick={handleKick}
                id='mm-remove-member'
              >
                <Icon size={0.7} path={mdiAccountMinus} />
              </button>
              <Tooltip anchorSelect='#mm-change-role' content='Change role' style={{ zIndex: 200 }} delayShow={750} />
              <Tooltip anchorSelect='#mm-remove-member' content='Remove from project' style={{ zIndex: 200 }} delayShow={750} />
            </>
          )}
          {action === ACTIONS.INVITE && (
            <>
              <button
                className='mm-btn mm-btn--primary'
                disabled={!invitable}
                onClick={handleInvite}
                id='mm-add-member'
              >
                <Icon size={0.7} path={mdiAccountPlus} />
              </button>
              <Tooltip anchorSelect='#mm-add-member' content='Invite to project' style={{ zIndex: 200 }} delayShow={750} />
            </>
          )}
        </div>

        {/* List content */}
        <div className='mm-content'>
          {action === ACTIONS.KICK
            ? <Members memberlist={memberList} handleSelect={changeSelection} />
            : <Invite replication={replication} handleSelect={changeSelection} />
          }
        </div>
      </div>
    </div>
  )
}

MemberManagement.propTypes = {
  managedProject: PropTypes.object.isRequired,
  replication: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

export default MemberManagement
