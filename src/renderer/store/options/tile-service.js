import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [service, tags] = await this.store.collect(id, keys)

  const isTerrain = (service.terrain || []).length > 0 ||
    service.capabilities?.contentType === 'terrain/mapbox-rgb'

  const option = {
    id,
    title: service.name,
    scope: service.type,
    tags: [
      `SCOPE:${service.type}:NONE`,
      isTerrain ? 'SYSTEM:TERRAIN::mdiTerrain' : null,
      ...((tags || []))
        .filter(Boolean)
        .map(label => `USER:${label}:NONE`),
      'PLUS'
    ].filter(Boolean).join(' '),
    capabilities: 'TAG|RENAME'
  }

  return option
}
