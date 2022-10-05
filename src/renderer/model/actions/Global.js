import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/**
 *
 */
export default function Global (options) {
  this.store = options.store
  this.selection = options.selection
  this.sessionStore = options.sessionStore
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

const colorScheme = context => ['dark', 'medium', 'light'].map(scheme => ({
  id: `scheme:${scheme}`,
  name: `Color Scheme - ${capitalize(scheme)}`,
  keywords: ['color', 'scheme', scheme],
  shortcut: [`$mod+S ${scheme[0].toUpperCase()}`],
  perform: () => context.store.update(['style+default'], style => ({
    ...style,
    'color-scheme': scheme
  }))
}))

const lineWidth = context => [
  ['thin', 1, 'Style - Line Width - Thin (S)'],
  ['medium', 2, 'Style - Line Width - Medium (M)'],
  ['thick', 3, 'Style - Line Width - Thick (L)'],
  ['thickest', 4, 'Style - Line Width - Thickest (XL)']
].map(spec => ({
  id: `'style:line-width.${spec[0]}'`,
  name: spec[2],
  keywords: ['style', 'line', 'width', spec[0]],
  perform: () => context.store.update(['style+default'], value => ({ ...value, 'line-width': spec[1] }))
}))

Global.prototype.actions = function () {
  return [
    ...colorScheme(this),
    ...lineWidth(this),
    {
      id: 'create:layer',
      name: 'Create - New Layer',
      keywords: ['create', 'new', 'layer'],
      shortcut: ['$mod+N L'],
      perform: async () => {
        const key = ID.layerId()
        await this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
        this.selection.focus(key)
      }
    },
    {
      id: 'create:tile-service',
      name: 'Create - New Tile Service',
      keywords: ['create', 'new', 'tile', 'service'],
      shortcut: ['$mod+N T'],
      perform: async () => {
        const key = ID.tileServiceId()
        this.store.insert([[key, { type: 'OSM', url: '', name: '' }]])
        this.selection.focus(key)
      }
    },
    {
      id: 'create:marker',
      name: 'Create - New Marker',
      keywords: ['create', 'new', 'marker'],
      shortcut: ['$mod+N M'],
      perform: async () => {
        const viewport = await this.sessionStore.get('viewport')
        const key = ID.markerId()
        const value = {
          name: `Marker - ${militaryFormat.now()}`,
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: viewport.center
          }
        }

        this.store.insert([[key, value]])
        this.selection.focus(key)
      }
    },
    {
      id: 'create:bookmark',
      name: 'Create - New Bookmark',
      keywords: ['create', 'new', 'bookmark'],
      shortcut: ['$mod+N B'],
      perform: async () => {
        const viewport = await this.sessionStore.get('viewport')
        const key = ID.bookmarkId()
        const name = `Bookmark - ${militaryFormat.now()}`
        const value = { name, ...viewport }
        this.store.insert([[key, value]])
        this.selection.focus(key)
      }
    }
  ]
}

