import * as R from 'ramda'
import * as ID from '../../ids'

// Batch operations order:
//   0 - (del, style+)
//   1 - (del, feature)
//   2 - (put, style+)
//   3 - (put, feature)
//   4 - other
const ord = R.cond([
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(0)],
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(1)],
  [R.both(R.propEq('put', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(2)],
  [R.both(R.propEq('put', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(3)],
  [R.T, R.always(4)]
])

export default ord
