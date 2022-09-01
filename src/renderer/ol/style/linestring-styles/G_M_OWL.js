import { fenceX, fencePoints } from './commons'

export default context => {
  const { geometry } = context
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(24, context)
      .map(options => [...options, [0, -7]])
      .map(fenceX(context))
  ]
}
