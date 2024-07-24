import * as R from 'ramda'
import * as TS from '../ts'

export default (mode, geometry) => {
  const selection = []
  const guideline = mode === 'singleselect'
    ? { id: 'style:guide-stroke', geometry }
    : null

  const points = () => TS.points(geometry)

  const handles = R.cond([
    [R.equals('default'), R.always(null)],
    [R.equals('singleselect'), R.always({ id: 'style:circle-handle', geometry: TS.multiPoint(points()) })],
    [R.equals('multiselect'), R.always({ id: 'style:rectangle-handle', geometry: points()[0] })]
  ])(mode)

  guideline && selection.push(guideline)
  handles && selection.push(handles)

  return selection
}
