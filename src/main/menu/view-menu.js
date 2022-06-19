import { dispatch, send } from './helpers'

export default options => {
  const preferences = options.preferences || {}
  const coordinatesFormat = preferences['coordinates-format'] || 'MGRS'

  return [{
    label: 'View',
    submenu: [
      { type: 'separator' },
      {
        label: 'Coordinates Format',
        submenu: [
          {
            label: 'MGRS',
            type: 'checkbox',
            checked: coordinatesFormat === 'MGRS',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_MGRS'))
          },
          {
            label: 'UTM',
            type: 'checkbox',
            checked: coordinatesFormat === 'UTM',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_UTM'))
          },
          {
            label: 'Latitude/Longitude',
            type: 'checkbox',
            checked: coordinatesFormat === 'LATLON',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_LATLON'))
          }
        ]
      },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }]
}
