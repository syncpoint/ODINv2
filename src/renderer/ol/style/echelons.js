import * as R from 'ramda'
import { echelonCode } from '../../symbology/2525c'
import Props from './style-props'
import A from './resources/A.png'
import B from './resources/B.png'
import C from './resources/C.png'
import D from './resources/D.png'
import E from './resources/E.png'
import F from './resources/F.png'
import G from './resources/G.png'
import H from './resources/H.png'
import I from './resources/I.png'
import J from './resources/J.png'
import K from './resources/K.png'
import L from './resources/L.png'
import M from './resources/M.png'
import N from './resources/N.png'

export const echelons = {
  A: { width: 24, height: 25, url: A },
  B: { width: 12, height: 12, url: B },
  C: { width: 26, height: 12, url: C },
  D: { width: 40, height: 12, url: D },
  E: { width: 6, height: 29, url: E },
  F: { width: 28, height: 29, url: F },
  G: { width: 50, height: 29, url: G },
  H: { width: 26, height: 29, url: H },
  I: { width: 64, height: 29, url: I },
  J: { width: 101, height: 29, url: J },
  K: { width: 138, height: 29, url: K },
  L: { width: 176, height: 29, url: L },
  M: { width: 213, height: 29, url: M },
  N: { width: 65, height: 24, url: N }
}

export const makeEchelonLabels = context => {
  const { styles, properties } = context
  const [icons, others] = R.partition(label => Props.iconImage(label), styles)
  context.styles = others

  icons.forEach(icon => {
    const code = echelonCode(properties.sidc)
    const echelon = echelons[code]

    if (!echelon) return // filter echelon style

    icon['icon-height'] = echelon.height
    icon['icon-width'] = echelon.width
    icon['icon-url'] = echelon.url
    icon['icon-scale'] = 0.4
    context.styles.push(icon)
  })

  return context
}
