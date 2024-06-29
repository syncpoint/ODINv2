import * as R from 'ramda'

export default (labels, labelPlacement) =>
  labels
    .map(R.tryCatch(labelPlacement, err => { console.warn(err); return undefined }))
    .filter(Boolean)
