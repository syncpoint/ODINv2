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

const colorScheme = context => ['Dark', 'Medium', 'Light'].map(scheme => ({
  id: `scheme:${scheme}`.toLowerCase(),
  name: `Color Scheme - ${scheme}`,
  keywords: ['color', 'scheme', scheme.toLowerCase()],
  perform: () => context.store.update(['style+default'], style => ({
    ...style,
    'color-scheme': scheme
  }))
}))

Global.prototype.actions = function () {
  return [
    ...colorScheme(this),
    {
      id: 'command:create:layer',
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
      id: 'command:create:tile-service',
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
      id: 'command:create:marker',
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
      id: 'command:create:bookmark',
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

