import * as R from 'ramda'
import { styles, makeStyles } from './styles'
import { MODIFIERS } from '../../2525c'

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

styles.Point = ({ feature, mode }) => {
  // TODO: e872d67c-7528-4ff6-9bee-b792b2a2fd7e - preferences/project: show/hide labels
  const featureStyles = makeStyles(feature, mode)
  const { sidc, ...properties } = feature.getProperties()

  const symbol = {
    sidc,
    size: 60,
    modifiers: modifiers(properties),
    outlineWidth: 4,
    outlineColor: 'white'
  }

  const icon = {
    scale: 0.5
  }

  return featureStyles.symbol(feature.getGeometry(), { symbol, icon })
}
