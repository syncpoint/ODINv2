import * as R from 'ramda'

/**
 * searchRBush :: Feature-Id Id => RBush -> Extent -> [Id]
 */
const searchRBush = rbush => extent => rbush.search({
  minX: extent[0],
  minY: extent[1],
  maxX: extent[2],
  maxY: extent[3]
}).map(R.last)

export default searchRBush
