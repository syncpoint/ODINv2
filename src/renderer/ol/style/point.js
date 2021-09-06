import * as R from 'ramda'
import { styles, makeStyles } from './styles'
import { MODIFIERS } from '../../symbology/2525c'

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

styles.Point = ({ feature, mode }) => {
  // TODO: e872d67c-7528-4ff6-9bee-b792b2a2fd7e - preferences/project: show/hide labels
  const geometry = feature.getGeometry()
  const featureStyles = makeStyles(feature, mode)
  const { sidc, ...properties } = feature.getProperties()

  // Don't want them handles when selected.
  const handles = mode !== 'selected'
    ? featureStyles.handles(geometry)
    : []

  const symbol = featureStyles.symbol(geometry, {
    sidc,
    // outlineWidth: 4,
    // outlineColor: 'white',
    ...modifiers(properties)
  })

  return [symbol, handles]
}
