import * as ID from '../../ids'

const textColor = 'black'
const textHaloColor = 'white'
const textHaloWidth = 3

export const defaultStyle = {
  'color-scheme': 'medium',
  'line-width': 2,
  'line-halo-width': 1,
  'text-font-size': '12px',
  'text-font-family': 'sans-serif',
  'text-color': textColor,
  'text-halo-color': textHaloColor,
  'text-halo-width': textHaloWidth,
  'symbol-text-color': textColor,
  'symbol-text-halo-color': textHaloColor,
  'symbol-text-halo-width': textHaloWidth * 1.5
}

const upgrade = async jsonDB => {
  // Store default style properties once for each fresh project database.
  await jsonDB.put(ID.defaultStyleId, defaultStyle)
}

const downgrade = () => {}

export default {
  LOADED: upgrade,
  UNLOADED: downgrade
}
