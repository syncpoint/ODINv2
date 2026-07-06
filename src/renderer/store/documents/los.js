import * as R from 'ramda'
import * as ID from '../../ids'

/**
 * Document handler for Line-of-Sight entities (search index).
 * @this {Object} Context with store property
 */
export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [los, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.LOS,
    text: los?.name || '',
    tags: tags || []
  }
}
