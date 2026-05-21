import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [marker, tags] = await this.store.collect(id, keys)

  if (!marker) return null

  return {
    id,
    scope: ID.MARKER,
    text: marker.name || '',
    tags: tags || []
  }
}
