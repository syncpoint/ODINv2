import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [measurement, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.MEASURE,
    text: measurement?.name || '',
    tags: tags || []
  }
}
