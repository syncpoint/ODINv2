import * as R from 'ramda'
import * as Extent from 'ol/extent'
import * as Sphere from 'ol/sphere'
import { toLonLat } from 'ol/proj'
import * as ID from '../../ids'
import { readGeometry } from '../../store/FeatureStore'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [place, userTags] = await this.store.collect(id, keys)
  const geometries = await this.store.geometries(id)
  const geometry = readGeometry(geometries[0])
  const center = Extent.getCenter(geometry.getExtent())
  const viewport = await this.sessionStore.get('viewport')
  const distance = Sphere.getDistance(toLonLat(center), toLonLat(viewport.center)) / 1000
  const formattedDistance = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(distance)

  const systemTags = place.tags
    .filter(s => s !== 'place')
    .filter(R.identity)
    .map(label => `SYSTEM:${label}:NONE`)


  return {
    id,
    title: place.name,
    sort: `${distance}`, // should be string because of Intl.Collator.compare()
    description: `${place.description} - ${formattedDistance} km`,
    tags: [
      'SCOPE:PLACE',
      ...systemTags,
      ...(userTags || []).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
