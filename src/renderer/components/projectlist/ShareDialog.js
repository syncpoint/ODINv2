import React from 'react'
import PropTypes from 'prop-types'
import './ProjectList.css'

/**
 * Dialog shown when the user clicks "Share" on a project.
 * Allows opting out of E2EE (enabled by default, secure by default).
 */
const ShareDialog = ({ projectName, onConfirm, onCancel }) => {
  const [encrypted, setEncrypted] = React.useState(true)

  const handleConfirm = () => {
    onConfirm({ encrypted })
  }

  return (
    <div className='share-dialog-overlay'>
      <div className='share-dialog'>
        <h3>Share Project</h3>
        <p>
          Share <strong>{projectName}</strong> with other users?
          Once shared, other users can be invited to collaborate.
        </p>

        <label className='share-dialog-checkbox'>
          <input
            type='checkbox'
            checked={encrypted}
            onChange={e => setEncrypted(e.target.checked)}
          />
          <span>Encrypt project data (recommended)</span>
        </label>
        <p className='share-dialog-hint'>
          {encrypted
            ? 'All project data will be end-to-end encrypted. Only project participants can read the data — not even the server.'
            : 'Project data will be sent without encryption. The server can read all replicated data.'
          }
        </p>

        <div className='share-dialog-buttons'>
          <button onClick={onCancel}>Cancel</button>
          <button className='share-dialog-primary' onClick={handleConfirm}>
            Share{encrypted ? ' (Encrypted)' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

ShareDialog.propTypes = {
  projectName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default ShareDialog
