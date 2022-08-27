/* eslint-disable camelcase */
import { teeth_2 } from './commons'

export default context => {
  const { TS } = context
  const path = TS.collect(teeth_2(-1)(context))
  return [{ id: 'style:2525c/solid-fill', geometry: path }]
}
