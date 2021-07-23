export default options => {
  const platform = options.platform || process.platform

  return [{
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(platform === 'darwin'
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },

            // FIXME: useless
            // TODO: 8ece194d-b5f3-4d6c-9746-6cc96018cd06 - menu/Window - list open projects
            { role: 'window' }
          ]
        : [{ role: 'close' }]
      )
    ]
  }]
}
