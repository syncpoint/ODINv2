import * as R from 'ramda'
import { area, length } from '../../ol/interaction/measure/tools'
import * as ID from '../../ids'
import LineString from 'ol/geom/LineString'
import Polygon from 'ol/geom/Polygon'

const getDescription = geometry => {
  switch (geometry.type) {
    case 'LineString': return `Distance ${length(new LineString(geometry.coordinates))}`
    case 'Polygon': { const polygon = new Polygon(geometry.coordinates); return `Area ${area(polygon)} - Circumfence ${length(polygon)}` }
    default: return ''
  }
}

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [measurement, hidden, locked, tags] = await this.store.collect(id, keys)

  const geometries = await this.store.geometries(id)
  const description = geometries.length === 1
    ? getDescription(geometries[0])
    : undefined


  return {
    id,
    title: measurement.name,
    description,
    tags: [
      'SCOPE:MEASURE:NONE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
