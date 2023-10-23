import React from 'react'
import PropTypes from 'prop-types'
import Members from './Members'
import './ProjectList.css'

const MemberManagement = props => {
  const { onClose, replication, managedProject } = props

  const [memberList, setMemberList] = React.useState([])

  React.useEffect(() => {
    const getMembers = async () => {
      const members = await replication.members(managedProject.id)
      setMemberList(members)
    }
    getMembers()
  }, [replication, managedProject])

  return (
  <div className='popup-container' onClick={() => onClose()}>
  <div className='member-container' onClick={ e => e.stopPropagation() }>
    <div className='title'>{ managedProject.name }</div>
    <div> SEARCH for new members</div>
    <Members memberlist={memberList} />
  </div>
</div>)
}

MemberManagement.propTypes = {
  managedProject: PropTypes.object.isRequired,
  replication: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

export default MemberManagement
