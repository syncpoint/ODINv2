const { webUtils } = require('electron')
const projects = require('./modules/projects')
const replication = require('./modules/replication')
const collaboration = require('./modules/collaboration')
const shell = require('./modules/shell')
const window_ = require('./modules/window')
const preferences = require('./modules/preferences')
const editing = require('./modules/editing')
const platform = require('./modules/platform')

// contextIsolation is off (renderer needs nodeIntegration for leveldown),
// so we assign directly instead of using contextBridge.
window.odin = {
  projects,
  replication,
  collaboration,
  shell,
  window: window_,
  preferences,
  editing,
  platform,
  webUtils
}
