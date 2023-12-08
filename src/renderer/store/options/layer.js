import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId, ID.defaultId, ID.sharedId]
  const [layer, hidden, locked, tags, defaultFlag, shared] = await this.store.collect(id, keys)
  const links = await this.store.keys(ID.prefix('link')(id))

  return {
    id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags: [
      'SCOPE:LAYER',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline',
      'SYSTEM:LAYER:OPEN:mdiFormatListBulletedType', // navigate to contained features
      ...(links.length ? ['SYSTEM:LINK::mdiLinkVariant'] : []),
      shared ? 'SYSTEM:SHARED:NONE:mdiCloudOutline' : undefined,
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      ...(defaultFlag ? ['USER:default:NONE'] : []),
      'PLUS'
    ].join(' ').replace('  ', ' ').trim(),
    highlight: defaultFlag,
    capabilities: 'RENAME|DROP'
  }
}
