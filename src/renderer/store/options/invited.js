import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [layer, tags] = await this.store.collect(id, keys)

  return {
    id,
    title: layer.name,
    description: layer.description || '',
    tags: [
      'SCOPE:INVITED',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ').replace('  ', ' ').trim(),
    capabilities: ''
  }
}
