import { dialog, Notification } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs'
import { militaryFormat } from '../shared/datetime'

export const exportLayer = async (event, layerName, content, format = 'odin') => {
  const isGeoJSON = format === 'geojson'
  const extension = isGeoJSON ? 'geojson' : 'json'
  const filterName = isGeoJSON ? 'GeoJSON' : 'ODIN Layer'

  const dialogOptions = {
    title: 'Export layer',
    defaultPath: sanitizeFilename(`${layerName}-${militaryFormat.now()}.${extension}`),
    filters: [{ name: filterName, extensions: [extension] }]
  }

  const interaction = await dialog.showSaveDialog(event.sender.getOwnerBrowserWindow(), dialogOptions)
  if (interaction.canceled) return
  try {
    // Pretty-print GeoJSON for readability
    const output = isGeoJSON
      ? JSON.stringify(content, null, 2)
      : JSON.stringify(content)
    await fs.promises.writeFile(interaction.filePath, output)
  } catch (error) {
    const n = new Notification({
      title: 'Export failed',
      body: error.message
    })
    n.show()
  }
}
