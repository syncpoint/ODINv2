import * as R from 'ramda'
import ord from './ord'
import { flat } from '../../../shared/signal'

const operations = R.compose(
  flat,
  R.map(R.sort((a, b) => ord(a) - ord(b))),
  R.map(R.prop('operations'))
)

export default operations
