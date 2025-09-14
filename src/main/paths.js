/**
 * Various filesystem paths to store data.
 */

import path from 'path'
import fs from 'fs'
import os from 'os'
import { app } from 'electron'

export const execPath = process.execPath

/**
 * Per-user application data directory, which by default points to:
 *
 *    %APPDATA% on Windows
 *    $XDG_CONFIG_HOME or ~/.config on Linux
 *    ~/Library/Application Support on macOS
 *
 * Note: Currently unused; included only for documentation purpose.
 */
/* eslint-disable no-unused-vars */
const appData = app.getPath('appData')
/* eslint-enable no-unused-vars */

/**
 * The directory for storing your app's configuration files,
 * which by default it is the appData directory appended
 * with your app's name.
 *
 * NOTE: Starting with v32.x Electron unconditionally deletes 'databases' directory
 * where we used to store all databases.
 * REFERENCE: https://github.com/electron/electron/issues/45396
 */
const userData = app.getPath('userData')

/**
 * The current application directory.
 */
const appPath = app.getAppPath()

/**
 * Directory to store all main/renderer databases.
 */
export const databases = path.join(userData, 'leveldb')
const databasesLegacy = path.join(userData, 'databases')

/**
 * Directory to store main/master database.
 */
export const master = path.join(databases, 'master')

/**
 * .env file for providing user related environment settings
 */
export const dotenv = path.join(userData, '.env')

/**
 * (Recusively) create directory for given path.
 * @param {string} path - directory to create.
 */
export const mkdir = path => fs.mkdirSync(path, { recursive: true })

/**
 * User home directory.
 */
export const userHome = os.homedir()

/**
 * Legacy ODIN home, usually $userHopme/ODIN.
 */
export const odinHome = path.join(userHome, 'ODIN')

/**
 * Legacy sources (aka tile providers).
 */
export const sources = location => path.join(location, 'sources.json')

/**
 * Legacy projects directory, usually $userHome/ODIN/projects.
 */
export const projects = location => path.join(location, 'projects')

/**
 * Legacy layers directory for a project.
 */
export const layers = (location, uuid) => path.join(projects(location), uuid, 'layers')

/**
 * Legacy layer file for a given project and layer name.
 */
export const layer = (location, uuid, layer) => path.join(projects(location), uuid, 'layers', `${layer}.json`)

/**
 * Legacy project metadata file path.
 */
export const metadata = (location, uuid) => path.join(projects(location), uuid, 'metadata.json')

/**
 * Legacy project preferences file path.
 */
export const preferences = (location, uuid) => path.join(projects(location), uuid, 'preferences.json')

export const staticIndexPage = path.join(appPath, 'dist', 'index.html')

/**
 *
 */
export const initStorageLocation = () => {
  if (fs.existsSync(databasesLegacy)) {
    fs.renameSync(databasesLegacy, databases)
  } else if (!fs.existsSync(databases)) {
    mkdir(databases)
  }
}
