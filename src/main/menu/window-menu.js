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
            // TODO: list windows
            { role: 'window' }
          ]
        : [{ role: 'close' }]
      )
    ]
  }]
}
