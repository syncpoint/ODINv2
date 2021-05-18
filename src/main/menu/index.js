import { app, Menu } from 'electron'
import appMenu from './app-menu'
import fileMenu from './file-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'

const menus = [appMenu, fileMenu, viewMenu, windowMenu]

export function ApplicationMenu (master, evented) {
  this._master = master
  this._evented = evented

  // TODO: update on window focus/close
  evented.on(':id/focus', event => console.log('[ApplicationMenu]', event))
  evented.on(':id/close', event => console.log('[ApplicationMenu]', event))
}

ApplicationMenu.prototype.show = async function () {

  const options = {
    platform: process.platform,
    appName: app.name,
    master: this._master,
    evented: this._evented
  }

  const template = await Promise.all(menus.flatMap(menu => menu(options)))
  const menu = Menu.buildFromTemplate(template)

  Menu.setApplicationMenu(menu)
}
