import * as R from 'ramda'
import * as shared from './shared'
import styles from './linestring-styles'

const rules = [
  shared.sidc,
  shared.evalTextField,
  shared.effectiveStyle,
  shared.geometry,
  shared.labelPlacements,
  shared.calculatedStyles,
  shared.labelStyles,
  shared.style
]

export default rules


/**
 * styleSpecification
 * labelSpecifications
 */
rules.push([next => {
  const { parameterizedSIDC: sidc } = next
  const styleSpecification = (styles[sidc] || styles.DEFAULT)
  const labelSpecifications = (labels[sidc] || [])
  return { styleSpecification, labelSpecifications }
}, ['parameterizedSIDC']])


/**
 * placement
 */
rules.push([next => {
  return { placement: placement(next) }
}, ['geometry']])


// ==> label specifications and placement

const placement = ({ TS, geometry }) => {
  const segments = TS.segments(geometry)
  const line = TS.lengthIndexedLine(geometry)
  const endIndex = line.getEndIndex()
  const coordAt = (fraction, offset = 0) => line.extractPoint(endIndex * fraction + offset)
  const pointAt = (fraction, offset = 0) => TS.point(coordAt(fraction, offset))
  const numPoints = geometry.getNumPoints()

  const segment = fraction => TS.segment([
    coordAt(fraction, -0.05),
    coordAt(fraction, +0.05)
  ])

  const angle = anchor => {
    if (!anchor) return segment(0.5).angle()
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return segment(0.5).angle()
      else if (anchor.includes('left')) return R.head(segments).angle()
      else if (anchor.includes('right')) return R.last(segments).angle()
    } else return segment(anchor).angle()
  }

  const anchors = anchor => {
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return pointAt(0.5)
      else if (anchor.includes('left')) return geometry.getPointN(0)
      else if (anchor.includes('right')) return geometry.getPointN(numPoints - 1)
      else return pointAt(0.5)
    } else return pointAt(anchor)
  }

  const normalize = angle => TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle)

  return props => {
    const rotate = props['text-field'] ? 'text-rotate' : 'icon-rotate'
    const anchor = props['text-anchor'] ||
      props['icon-anchor'] ||
      props['symbol-anchor'] ||
      (props['text-field'] ? 'center' : null)

    return {
      geometry: anchors(anchor),
      ...props,
      [rotate]: normalize(angle(anchor))
    }
  }
}

/**
 * Line string position mnemonics:
 *
 *  LEFT | LEFT         CENTER       RIGHT | RIGHT  (ANCHOR)
 *   END | START        CENTER         END | START  (JUSTFY)
 *
 *
 *   WNW | NNW            N            NNE | ENE    (ABOVE)
 *     W |----------------|----------------| E
 *   WSW | SSW            S            SSE | ESE    (BELOW)
 *
 * EW    := E + W
 * NNEW  := NNE + NNW
 * SSEW  := SSE + SSW
 * EWNEW := ENE + WNW
 * EWSEW := ESE + WSW
 */

const ABOVE = -20
const BELOW = 20

const W = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-10, 0], 'text-padding': 5 }
const E = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [10, 0], 'text-padding': 5 }
const NNW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const NNE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const SSW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, BELOW] }
const SSE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, BELOW] }
const NNEW = (text, options) => [NNE, NNW].map(props => ({ 'text-field': text, ...props, ...options }))

const MT = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE], 'text-clipping': 'none' }]
const MB = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW], 'text-clipping': 'none' }]
const MM = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const SE = text => [W, E].map(props => ({ 'text-field': text, ...props }))
const CFL_1 = { id: 'style:default-text', 'text-field': '"CFL" + (t ? " " + t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_2 = { id: 'style:default-text', 'text-field': ['w', 'w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2]
const PL_1 = T => [W, E].map(props => ({ 'text-field': `${T} ? "PL " + ${T} : null`, ...props }))
const PL_2 = (T1, T2) => [NNW, NNE].map(props => ({ 'text-field': `(${T1} ? ${T1} : "") + ((${T1} || ${T2}) ? " " : "") +  (${T2} ? ${T2} : "")`, ...props }))
const PL_3 = [SSW, SSE].map(props => ({ 'text-field': ['w', 'w1'], ...props }))
const PL = (T1, T2) => T1 ? [PL_1('t1'), PL_2(T1, T2), PL_3] : [PL_1('t'), PL_3]
const MFP_1 = { id: 'style:default-text', 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1]
const BND_1 = { id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, ABOVE] }
const BND_2 = { id: 'style:default-text', 'text-field': 't1', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, BELOW] }
const BND_3 = { 'icon-image': 'echelon', 'icon-anchor': 0.5, 'icon-padding': 10 }
const BND = [BND_1, BND_2, BND_3]

const labels = {}
labels['G*T*A-----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
labels['G*T*AS----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
labels['G*G*GLB---'] = BND // BOUNDARIES
labels['G*G*GLP---'] = PL() // PHASE LINE
labels['G*G*GLL---'] = PL('"LL"', 't') // LIGHT LINE
labels['G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
labels['G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
labels['G*G*OLF---'] = PL('"FCL"', 't') // FINAL COORDINATION LINE
labels['G*G*OLL---'] = PL('"LOA"', 't') // LIMIT OF ADVANCE
labels['G*G*OLT---'] = PL('"LD"', 't') // LINE OF DEPARTURE
labels['G*G*OLC---'] = PL('"LD/LC"', 't') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
labels['G*G*OLP---'] = PL('"PLD"', 't') // PROBABLE LINE OF DEPLOYMENT (PLD)
labels['G*G*SLH---'] = NNEW('"HL"', { 'text-offset': [0, -10] }) // HOLDING LINE
labels['G*G*SLR---'] = PL('"RL"', 't') // RELEASE LINE
labels['G*G*SLB---'] = NNEW('"BL"', { 'text-offset': [0, -10] }) // BRIDGEHEAD
labels['G*F*LT----'] = MT('t') // LINEAR TARGET
labels['G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
labels['G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
labels['G*F*LCF---'] = PL('t', '"FSCL"') // FIRE SUPPORT COORDINATION LINE (FSCL)
labels['G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
labels['G*F*LCN---'] = PL("'NFL'", 't') // NO-FIRE LINE (NFL)
labels['G*F*LCR---'] = PL('"RFL"', 't') // RESTRICTIVE FIRE LINE (RFL)
labels['G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
labels['G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
labels['G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
labels['G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
labels['G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
labels['G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
labels['G*O*B-----'] = MM('"B"') // BEARING LINE
labels['G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
labels['G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
labels['G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
labels['G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT
