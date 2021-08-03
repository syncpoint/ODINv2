import * as R from 'ramda'
import { transform } from './utm'
import { read, write } from './ts'

export default geometry => {
  const { toUTM, fromUTM } = transform(geometry)
  return {
    read: R.compose(read, toUTM),
    write: R.compose(fromUTM, write)
  }
}
