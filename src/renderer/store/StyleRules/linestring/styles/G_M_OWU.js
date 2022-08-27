import { fenceX, fencePoints } from './commons'

export default context => {
  return fencePoints(24, context).map(fenceX(context))
}
