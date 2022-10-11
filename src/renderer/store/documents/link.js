import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [link, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.LINK,
    text: link.name,
    tags: tags || []
  }
}
