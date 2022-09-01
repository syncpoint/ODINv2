import { fenceX, fencePoints } from './commons'

export default context => {
  const { geometry } = context
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(38, context).map(fenceX(context))
  ]
}
