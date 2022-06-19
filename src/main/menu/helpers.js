
export const dispatch = fn => (_, browserWindow) => {
  if (browserWindow) fn(browserWindow)
}

export const send = (browserWindow, command) => browserWindow.webContents.send(command)
