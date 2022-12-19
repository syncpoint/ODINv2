/* eslint-disable quotes */
import { autoUpdater } from 'electron-updater'
import { app, dialog, Notification } from 'electron'

const DELAY_CHECK_AFTER_APP_READY = 30000

const SelfUpdate = function () {}

SelfUpdate.prototype.checkForUpdates = function () {

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.forceDevUpdateConfig = !app.isPackaged

  autoUpdater.on('update-available', updateInfo => {

    const releaseName = updateInfo.releaseName ? `Release name: ${updateInfo.releaseName}` : ''

    const releaseNotes = updateInfo.releaseNotes
      ? Array.isArray(updateInfo.releaseNotes)
        ? updateInfo.releaseNotes.join('\n')
        : updateInfo.releaseNotes
      : ''

    dialog.showMessageBox({
      title: 'Update available',
      type: 'info',
      message: `
        A new version of ODINv2 is available!

        Do you want to download version ${updateInfo.version}?`,
      detail: `
        ${releaseName}

        ${releaseNotes}`,
      buttons: ['Download now!', 'Remind me next time please!'],
      cancelId: 1
    })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-downloaded', updateInfo => {
    dialog.showMessageBox({
      title: 'Update is ready to install',
      type: 'info',
      message: `
        A new version of ODINv2 is ready to install!
        
        Do you want to install version ${updateInfo.version} now?`,
      buttons: ['Install now!', 'Not now!'],
      cancelId: 1
    })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (error) => {
    (new Notification({
      title: 'Update error',
      body: error.message
    })).show()
  })

  setTimeout(autoUpdater.checkForUpdates, DELAY_CHECK_AFTER_APP_READY)
}

export default SelfUpdate
