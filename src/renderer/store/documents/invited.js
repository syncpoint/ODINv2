import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const X = await this.store.collect(id, keys)
  const [layer, tags] = X

  return {
    id,
    scope: ID.INVITED,
    text: layer.name || '',
    tags: tags || []
  }
}
