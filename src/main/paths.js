/**
 * Various filesystem paths to store data.
 */

import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * Due to current setup (CommonJS) and module loading limitations
 * with Mocha, we cannot directly import { app } from 'electron',
 * which would be the 'right' thing to do.
 * See also function `initPaths` below.
 */

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
const appData = app => app.getPath('appData')
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
const userData = app => app.getPath('userData')

/**
 * The current application directory.
 */
const appPath = app => app.getAppPath()

/**
 * Directory to store all main/renderer databases.
 */
export const databases = app => path.join(userData(app), 'leveldb')
const databasesLegacy = app => path.join(userData(app), 'databases')

/**
 * Directory to store main/master database.
 */
export const master = app => path.join(databases(app), 'master')

/**
 * .env file for providing user related environment settings
 */
export const dotenv = app => path.join(userData(app), '.env')

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

export const staticIndexPage = app => path.join(appPath(app), 'dist', 'index.html')

/**
 *
 */
export const initStorageLocation = app => {
  if (fs.existsSync(databasesLegacy(app))) {
    fs.renameSync(databasesLegacy(app), databases(app))
  } else if (!fs.existsSync(databases(app))) {
    mkdir(databases(app))
  }
}

export const initPaths = app => ({
  execPath,
  databases: databases(app),
  master: master(app),
  dotenv: dotenv(app),
  userHome,
  odinHome,
  sources,
  projects,
  layers,
  layer,
  metadata,
  preferences,
  staticIndexPage: staticIndexPage(app),
  initStorageLocation: () => initStorageLocation(app)
})
