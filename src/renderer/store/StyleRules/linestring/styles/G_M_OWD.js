import { fenceXX, fencePoints } from './commons'

export default context => {
  const { geometry } = context
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(60, context).map(fenceXX(context))
  ].flat()
}
