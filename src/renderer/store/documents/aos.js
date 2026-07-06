import * as R from 'ramda'
import * as ID from '../../ids'

/**
 * Document handler for Area-of-Sight entities (search index).
 * @this {Object} Context with store property
 */
export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [aos, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.AOS,
    text: aos?.name || '',
    tags: tags || []
  }
}
