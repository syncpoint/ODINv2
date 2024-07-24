import * as R from 'ramda'
import { transform } from '../../model/geometry'
import { destructure } from '../../../shared/signal'

export default R.compose(
  destructure(['read', 'write', 'pointResolution']),
  R.map(transform)
)
