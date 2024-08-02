import RBush from 'rbush'

export default class FlatRBush extends RBush {
  toBBox = item => ({ minX: item[0], minY: item[1], maxX: item[2], maxY: item[3] })
  compareMinX = (a, b) => a[0] - b[0]
  compareMinY = (a, b) => a[1] - b[1]
}
