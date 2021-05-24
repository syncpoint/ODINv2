import util from 'util'
import { app, Menu } from 'electron'
import appMenu from './app-menu'
import fileMenu from './file-menu'
import editMenu from './edit-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'
import Emitter from '../../shared/emitter'

const menus = [appMenu, fileMenu, editMenu, viewMenu, windowMenu]

/**
 * @constructor
 * @param {SessionStore} sessionStore
 * @fires project/create create new project
 * @fires project/open/:key open existing project
 */
export function ApplicationMenu (sessionStore) {
  Emitter.call(this)
  this.sessionStore = sessionStore
}

util.inherits(ApplicationMenu, Emitter)


ApplicationMenu.prototype.show = async function () {

  const options = {
    platform: process.platform,
    appName: app.name,
    sessionStore: this.sessionStore,
    emitter: this
  }

  const template = await Promise.all(menus.flatMap(menu => menu(options)))
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)
}
