import { ipcMain } from 'electron'
import { dispatch, send } from './helpers'

/*
  Undo/Redo:
  webContents.undo() and webContents.redo() affect the undo history of
  any (input) element visible in renderer. This behavior is not expected
  when map has focus and undo should only be performed on feature edits
  or other application-level commands.
  To fix this, undo/redo first send a request to renderer (EDIT_UNDO/EDIT_REDO).
  The renderer checks the active element. In case active element is a input
  or similar element, renderer responds with DO_UNDO/DO_REDO messages back to
  main process, which in turn invokes undo()/redo() from senders webContents.
  If no input element is active, renderer assumes an application-level undo and
  does not send DO_UNDO/DO_REDO, but performs undo/redo on the application
  undo history.

  Initial, now deprecated implementation (retained for documentation purpose):
  By default, respective roles are dispatched to webcontents only.
  To enable application-level undo/redo behavior, we also send IPC messages.
  It is the renderers responsibility to determin whether undo/redo should
  be performed on the active element (HTMLInputElement and such) or handled on
  a higher (application) level, i.e. manipulate undo/redo stacks.
  The basic idea is to block application level behavior when the active element
  is capable of processing undo/redo.
*/

// Only forward UNDO/REDO to webContents when renderer requested such.

ipcMain.on('DO_UNDO', (event) => {
  const window = event.sender.getOwnerBrowserWindow()
  window.webContents.undo()
})

ipcMain.on('DO_REDO', (event) => {
  const window = event.sender.getOwnerBrowserWindow()
  window.webContents.redo()
})


export default options => {
  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: dispatch(browserWindow => send(browserWindow, 'EDIT_UNDO'))
      },
      {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
        click: dispatch(browserWindow => send(browserWindow, 'EDIT_REDO'))
      },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      {
        label: 'Select All',

        // CTRL-A shortcut on Windows platform has only an effect
        // for active input elements. EDIT_SELECT_ALL will not be send
        // when menu is invoked by shortcut.
        // Selecting menu entry with mouse does though.
        // We also use Mousetrap binding in renderer to get around this.

        accelerator: 'CmdOrCtrl+A',
        click: dispatch(browserWindow => {
          browserWindow.webContents.selectAll()
          send(browserWindow, 'EDIT_SELECT_ALL')
        })
      }
    ]
  }
}
