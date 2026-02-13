import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'
import * as Geometry from '../geometry'

const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])

/**
 * Check if a feature is a text shape.
 */
const isTextShape = feature => {
  return feature?.properties?.type === 'TEXT_SHAPE'
}

/**
 * Check if a feature is a shape (line/polygon without military semantics).
 * Geometry is passed separately since it's stored in wkbDB.
 */
const isShape = (feature, geometry) => {
  const properties = feature?.properties || {}
  if (properties.sidc) return false
  if (isTextShape(feature)) return false
  const geomType = geometry?.type || feature?.geometry?.type
  return geomType === 'LineString' || geomType === 'Polygon'
}

/**
 * Get geometry type from separately loaded geometry or feature.
 */
const getGeomType = (feature, geometry) => {
  return geometry?.type || feature?.geometry?.type
}

const shapeGeometryLabel = feature => {
  const geomType = feature?.geometry?.type
  if (geomType === 'LineString') return 'Line'
  if (geomType === 'Polygon') return 'Polygon'
  return 'Shape'
}

export default async function (id) {
  const keys = [R.identity, ID.layerId, ID.hiddenId, ID.lockedId, ID.restrictedId, ID.tagsId]
  const [feature, layer, hidden, locked, restricted, tags] = await this.store.collect(id, keys)
  const links = await this.store.keys(ID.prefix('link')(id))

  // Geometry is stored separately in wkbDB — load it for shape detection.
  const geometry = await this.store.geometry(id).catch(() => null)

  const properties = feature.properties || {}
  const sidc = properties.sidc

  // Handle text shapes
  if (isTextShape(feature)) {
    const description = layer?.name
      ? layer.name.toUpperCase() + ' ⏤ Text'
      : 'Text'

    return {
      id,
      title: feature.name || 'Text',
      description,
      path: 'mdiFormatText',
      tags: [
        'SCOPE:FEATURE',
        hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
        restricted ? 'SYSTEM:RESTRICTED:NONE:mdiShieldLockOutline' : (locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline'),
        ...(links.length ? ['SYSTEM:LINK::mdiLinkVariant'] : []),
        'SYSTEM:TEXT:NONE',
        'SYSTEM:SHAPE:NONE',
        ...(tags || []).map(label => `USER:${label}:NONE::${!restricted ?? false}`),
        restricted ? undefined : 'PLUS'
      ].filter(Boolean).join(' '),
      capabilities: restricted ? 'FOLLOW' : 'RENAME|DROP|FOLLOW'
    }
  }

  // Handle shapes (features without military semantics)
  if (isShape(feature, geometry)) {
    const geomType = getGeomType(feature, geometry)
    const geometryTag = geomType === 'Polygon'
      ? 'SYSTEM:POLYGON:NONE'
      : 'SYSTEM:LINE:NONE'

    const description = layer?.name
      ? layer.name.toUpperCase() + ' ⏤ ' + shapeGeometryLabel(feature)
      : shapeGeometryLabel(feature)

    return {
      id,
      title: feature.name || shapeGeometryLabel(feature),
      description,
      // No military symbol SVG — use MDI icon path instead
      path: geomType === 'Polygon' ? 'mdiVectorPolygon' : 'mdiVectorLine',
      tags: [
        'SCOPE:FEATURE',
        hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
        restricted ? 'SYSTEM:RESTRICTED:NONE:mdiShieldLockOutline' : (locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline'),
        ...(links.length ? ['SYSTEM:LINK::mdiLinkVariant'] : []),
        geometryTag,
        'SYSTEM:SHAPE:NONE',
        ...(tags || []).map(label => `USER:${label}:NONE::${!restricted ?? false}`),
        restricted ? undefined : 'PLUS'
      ].filter(Boolean).join(' '),
      capabilities: restricted ? 'FOLLOW' : 'RENAME|DROP|FOLLOW'
    }
  }

  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']
  const geometryType = Geometry.type(descriptor)
  const identity = identityTag(MILSTD.identityCode(sidc))
  const description = layer?.name
    ? layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')
    : hierarchy.join(' • ')

  const geometryTag = geometryType === 'Polygon'
    ? `SYSTEM:${geometryType.toLowerCase()}`
    : `SYSTEM:${geometryType.toLowerCase()}:NONE`

  return {
    id,
    title: feature.name || properties.t || null, // might be undefined
    description,
    svg: svg(sidc),
    tags: [
      'SCOPE:FEATURE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      restricted ? 'SYSTEM:RESTRICTED:NONE:mdiShieldLockOutline' : (locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline'),
      ...(links.length ? ['SYSTEM:LINK::mdiLinkVariant'] : []),
      geometryTag,
      ...dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...scope.map(label => `SYSTEM:${label}:NONE`),
      ...identity.map(label => `SYSTEM:${label}:NONE`),
      ...(tags || []).map(label => `USER:${label}:NONE::${!restricted ?? false}`),
      restricted ? undefined : 'PLUS'
    ].filter(Boolean).join(' '),
    capabilities: restricted ? 'FOLLOW' : 'RENAME|DROP|FOLLOW'
  }
}
