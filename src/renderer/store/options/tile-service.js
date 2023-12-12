import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [service, tags] = await this.store.collect(id, keys)

  const option = {
    id,
    title: service.name,
    scope: service.type,
    tags: [
      `SCOPE:${service.type}:NONE`,
      (tags || []).some(t => t === 'TERRAIN') ? 'SYSTEM:TERRAIN::mdiTerrain' : null,
      ...((tags || []))
        .filter(Boolean)
        .filter(t => t !== 'TERRAIN').map(label => `USER:${label}:NONE`),
      'PLUS'
    ].filter(Boolean).join(' '),
    capabilities: 'TAG|RENAME'
  }

  return option
}
