import * as R from 'ramda'
import { styles } from './styles'
import { MODIFIERS } from '../../symbology/2525c'

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

styles['Point:DEFAULT'] = ({ feature, geometry, properties, sidc }) => {
  if (!sidc) return [{ id: 'style:default', geometry }]

  return [{
    id: 'style:2525c/symbol',
    geometry,
    'symbol-code': feature.get('sidc'),
    'symbol-modifiers': modifiers(properties),
    'symbol-color-scheme': 'light'
  }]
}
