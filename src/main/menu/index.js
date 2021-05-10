import appMenu from './app-menu'
import fileMenu from './file-menu'
import viewMenu from './view-menu'
import windowMenu from './window-menu'

const menus = [appMenu, fileMenu, viewMenu, windowMenu]

export const template = options =>
  menus.flatMap(menu => menu(options))
