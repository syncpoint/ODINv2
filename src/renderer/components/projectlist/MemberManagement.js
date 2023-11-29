import React from 'react'
import PropTypes from 'prop-types'
import Members from './Members'
import Invite from './Invite'
import './ProjectList.css'
import { Button } from './Button'

const MemberManagement = props => {
  const { onClose, replication, managedProject } = props

  const ACTIONS = {
    KICK: 'kick',
    INVITE: 'invite'
  }

  const getMembers = async () => {
    const members = await replication.members(managedProject.id)
    const p = await replication.permissions(managedProject.id)
    setPermissions(p)
    const enhancedMembersList = members
      .filter(m => m.membership !== 'leave')
      .map(m => ({ ...m, id: m.userId }))

    setMemberList(enhancedMembersList)
  }

  const [memberList, setMemberList] = React.useState([])
  const [permissions, setPermissions] = React.useState({})
  const [action, setAction] = React.useState(ACTIONS.KICK)
  const [selected, setSelected] = React.useState([])

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

  const notKickable = () => {
    if (selected.length === 0) return true
    if (!permissions[ACTIONS.KICK]) return true
    const r = memberList
      .filter(m => selected.includes(m.userId))
      .some(m => m.membership === 'invite')
    return !r
  }

  const notInvitable = () => {
    if (selected.length === 0) return true
    if (!permissions[ACTIONS.INVITE]) return true
    const r = memberList
      .filter(m => selected.includes(m.userId))
    return r.length > 0
  }

  return (
  <div className='popup-container' onClick={() => onClose()}>
  <div className='member-container' onClick={ e => e.stopPropagation() } >
    <div className='mm-header'>
      <div className='title'>{ managedProject.name }</div>
      <Button disabled={!permissions.invite} onClick={toggleView}>{ action === ACTIONS.KICK ? 'Invite people' : 'Show current members'}</Button>
    </div>
    <div className='mm-header'>
      { action === ACTIONS.KICK && <Button
                                      onClick={handleKick}
                                      style={{ marginLeft: 'auto', marginRight: '6px' }}
                                      disabled={notKickable()}>Withdraw invitation
                                   </Button>
      }
      {
        action === ACTIONS.INVITE && <Button
                                        onClick={handleInvite}
                                        style={{ marginLeft: 'auto', marginRight: '6px' }}
                                        disabled={notInvitable()}>Invite
                                     </Button>
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
