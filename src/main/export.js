import { dialog, Notification } from 'electron'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs'
import { militaryFormat } from '../shared/datetime'

export const exportLayer = async (event, layerName, content) => {

  const dialogOptions = {
    title: 'Export layer',
    defaultPath: sanitizeFilename(`${layerName}-${militaryFormat.now()}.json`),
    filters: [{ name: 'Layer', extensions: ['json'] }]
  }

  const interaction = await dialog.showSaveDialog(event.sender.getOwnerBrowserWindow(), dialogOptions)
  if (interaction.canceled) return
  try {
    await fs.promises.writeFile(interaction.filePath, JSON.stringify(content))
  } catch (error) {
    const n = new Notification({
      title: 'Export failed',
      body: error.message
    })
    n.show()
  }
}
