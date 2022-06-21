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
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'MGRS'))
          },
          {
            label: 'UTM',
            type: 'checkbox',
            checked: coordinatesFormat === 'UTM',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'UTM'))
          },
          {
            label: 'Latitude/Longitude',
            type: 'checkbox',
            checked: coordinatesFormat === 'LATLON',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'LATLON'))
          },
          {
            label: 'Degrees, minutes, and seconds (DMS)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DMS',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DMS'))
          },
          {
            label: 'Degrees and decimal minutes (DDM)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DDM',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DDM'))
          },
          {
            label: 'Decimal degrees (DD)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DD',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DD'))
          },
          {
            label: 'Open Location Code',
            type: 'checkbox',
            checked: coordinatesFormat === 'PLUS',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'PLUS'))
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
