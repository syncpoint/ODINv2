/* eslint-disable camelcase */
import { teeth_1 } from './commons'

export default context => {
  const { TS, geometry } = context
  const path = TS.collect([geometry, ...teeth_1(context)])
  return [{ id: 'style:2525c/solid-fill', geometry: path }]
}
