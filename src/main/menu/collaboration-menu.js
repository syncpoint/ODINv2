
/**
 * @typedef {Object} CollaborationMenuOptions
 * @property {ProjectStore} sessionStore
 * @property {Emitter} emitter
 */

/**
 * @function
 * @name CollaborationMenu
 * @param {CollaborationMenuOptions} options
 */
export default async options => {
  const { projectStore, emitter } = options
  const credentials = await projectStore.getCredentials('default')

  const submenu = credentials
    ? [
        {
          label:
          `Disable collaboration for ${credentials.user_id}`,
          click: (/* menuItem, browserWindow, event */) => {
            emitter.emit('collaboration/disable')
          }
        }
      ]
    : [
        {
          label:
        'Enable collaboration',
          click: (/* menuItem, browserWindow, event */) => {
            emitter.emit('collaboration/enable')
          }
        }
      ]

  return {
    label: 'Collaboration',
    submenu
  }
}
