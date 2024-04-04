import * as R from 'ramda'
import fan from './hooks-fan'
import rectangle from './hooks-rectangle'
import corridor from './hooks-corridor'
import collection from './hooks-collection'
import apz from './hooks-apz'

export const Hooks = {}

Hooks['LineString:Point-corridor'] = corridor
Hooks['LineString:Point-orbit'] = corridor
Hooks['MultiPoint-fan'] = fan
Hooks['MultiPoint-circle'] = fan
Hooks['Polygon-rectangle'] = rectangle
Hooks['LineString:MultiPoint:MultiPoint-apz'] = apz // artillery position zones
Hooks.GeometryCollection = collection

const NullHooks = {
  project: R.identity,
  coordinates: R.identity
}

Hooks.get = (node, offset) => {
  const hooks = Hooks[node.signature]
  return hooks ? hooks(node, offset) : NullHooks
}
