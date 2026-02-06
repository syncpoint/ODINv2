import React from 'react'
import { ipcRenderer } from 'electron'
import './collaboration.css'

export const Logout = () => {

  const handleLogout = async () => {
    console.log('logging out')

    await ipcRenderer.invoke('PURGE_COLLABORATION_SETTINGS')
    ipcRenderer.postMessage('REFRESH_MENU')
    ipcRenderer.postMessage('CLOSE_WINDOW', 'logout')
  }

  return (
    <div className='collaboration_container'>
      <div className='collaboration_remarks'>
        <p>Logging out will remove your credentials and the <em>SHARED</em> tag from all your projects.</p>
        <p>You will keep all data currently stored locally but you will not be able to collaborate with others.</p>
        <p>In order to re-enable collaboration you must login to a [matrix] server and either re-share your projects or get invited by others.</p>
        <button
          className='login_button'
          type="submit"
          onClick={handleLogout}
          >
            LOGOUT and REMOVE CREDENTIALS
        </button>
      </div>
    </div>
  )
}
