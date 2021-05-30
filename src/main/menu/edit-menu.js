
const dispatch = fn => (_, browserWindow) => {
  if (browserWindow) fn(browserWindow)
}

/*
  Undo/Redo:
  By default, respective roles are dispatched to webcontents only.
  To enable application level undo/redo behavior, we also send IPC messages.
  It is the renderers responsibility to determin whether undo/redo should
  be performed on the active element (HTMLInputElement and such) or handled on
  a higher (application) level, i.e. manipulate undo/redo stacks.
  The basic idea is to block application level behavior when the active element
  is capable of processing undo/redo.
*/

export default async options => {
  const platform = options.platform || process.platform

  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: dispatch(browserWindow => {
          browserWindow.webContents.undo()
          browserWindow.send('EDIT_UNDO')
        })
      },
      {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
        click: dispatch(browserWindow => {
          browserWindow.webContents.redo()
          browserWindow.send('EDIT_REDO')
        })
      },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(platform === 'darwin'
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  }
}
