
export const dispatch = fn => (_, browserWindow) => {
  if (browserWindow) fn(browserWindow)
}

export const send = (browserWindow, ...args) => browserWindow.webContents.send(...args)
