import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [place, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.PLACE,
    text: place.display_name,
    tags: [
      ...place.tags,
      ...(tags || [])
    ].filter(R.identity)
  }
}
