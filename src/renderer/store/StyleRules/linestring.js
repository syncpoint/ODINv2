/* eslint-disable camelcase */
import * as R from 'ramda'
import { rules } from './rules'
import * as TS from '../../ol/ts'
import { PI_OVER_2, PI } from '../../../shared/Math'

rules.LineString = [
  ...rules.shared,
  ...rules.generic
]

/**
 * simplified, geometry_simplified
 */
rules.LineString.push([next => {
  const geometry_defining = next.geometry_defining

  // Never simplify current selection.
  const simplified = next.mode === 'singleselect'
    ? false
    : geometry_defining.getCoordinates().length > 50

  const geometry_simplified = simplified
    ? geometry_defining.simplify(next.resolution_center)
    : geometry_defining

  return { simplified, geometry_simplified }
}, ['resolution_center', 'mode', 'geometry_key', 'geometry_defining']])


/**
 * labels
 */
rules.LineString.push([next => {
  const sidc = next.sidc_parameterized
  return { labels: LABELS[sidc] || [] }
}, ['sidc_parameterized']])

/**
 * label_options
 */
rules.LineString.push([next => {
  const write = next.write
  const geometry = next.geometry_utm

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

  const label_options = label => {
    const anchor = label['text-anchor'] ||
      label['icon-anchor'] ||
      label['symbol-anchor'] ||
      (label['text-field'] ? 'center' : null)

    const rotation = normalize(angle(anchor))
    const flipped = rotation ? rotation < -PI_OVER_2 || rotation > PI_OVER_2 : false
    const textAlign = label['text-justify'] || null
    const textOffset = label['text-offset'] || [0, 0]
    const offsetX = flipped ? -1 * textOffset[0] : textOffset[0]
    const offsetY = textOffset[1]
    const padding = label['text-padding'] && new Array(4).fill(label['text-padding'])

    return {
      geometry: write(anchors(anchor)),
      options: {
        text: label['text-field'],
        rotation: rotation ? flipped ? rotation + PI : rotation : null,
        textAlign: textAlign ? flipped ? label['text-align'] : textAlign : null,
        offsetX,
        offsetY,
        padding
      }
    }
  }

  return { label_options }
}, ['write', 'geometry_utm']])

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

const W = { 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-10, 0], 'text-padding': 5 }
const E = { 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [10, 0], 'text-padding': 5 }
const NNW = { 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [10, -15] }
const NNE = { 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [-10, -15] }
const SSW = { 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [10, BELOW] }
const SSE = { 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [-10, BELOW] }
const NNEW = (text, options) => [NNE, NNW].map(props => ({ 'text-field': text, ...props, ...options }))

const MT = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE], 'text-clipping': 'none' }]
const MB = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW], 'text-clipping': 'none' }]
const MM = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const SE = text => [W, E].map(props => ({ 'text-field': text, ...props }))
const CFL_1 = { 'text-field': '"CFL" + (t ? " " + t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_2 = { 'text-field': ['w', 'w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2]
const PL_1 = T => [W, E].map(props => ({ 'text-field': `${T} ? "PL " + ${T} : null`, ...props }))
const PL_2 = (T1, T2) => [NNW, NNE].map(props => ({ 'text-field': `(${T1} ? ${T1} : "") + ((${T1} || ${T2}) ? " " : "") +  (${T2} ? ${T2} : "")`, ...props }))
const PL_3 = [SSW, SSE].map(props => ({ 'text-field': ['w', 'w1'], ...props }))
const PL = (T1, T2) => T1 ? [PL_1('t1'), PL_2(T1, T2), PL_3] : [PL_1('t'), PL_3]
const MFP_1 = { 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1]
const BND_1 = { 'text-field': 't', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, ABOVE] }
const BND_2 = { 'text-field': 't1', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, BELOW] }
const BND_3 = { 'icon-image': 'echelon', 'icon-anchor': 0.5, 'icon-padding': 10 }
const BND = [BND_1, BND_2, BND_3]

const LABELS = {}

LABELS['G*T*A-----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
LABELS['G*T*AS----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
LABELS['G*G*GLB---'] = BND // BOUNDARIES
LABELS['G*G*GLP---'] = PL() // PHASE LINE
LABELS['G*G*GLL---'] = PL('"LL"', 't') // LIGHT LINE
LABELS['G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
LABELS['G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
LABELS['G*G*OLF---'] = PL('"FCL"', 't') // FINAL COORDINATION LINE
LABELS['G*G*OLL---'] = PL('"LOA"', 't') // LIMIT OF ADVANCE
LABELS['G*G*OLT---'] = PL('"LD"', 't') // LINE OF DEPARTURE
LABELS['G*G*OLC---'] = PL('"LD/LC"', 't') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
LABELS['G*G*OLP---'] = PL('"PLD"', 't') // PROBABLE LINE OF DEPLOYMENT (PLD)
LABELS['G*G*SLH---'] = NNEW('"HL"', { 'text-offset': [0, -10] }) // HOLDING LINE
LABELS['G*G*SLR---'] = PL('"RL"', 't') // RELEASE LINE
LABELS['G*G*SLB---'] = NNEW('"BL"', { 'text-offset': [0, -10] }) // BRIDGEHEAD
LABELS['G*F*LT----'] = MT('t') // LINEAR TARGET
LABELS['G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
LABELS['G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
LABELS['G*F*LCF---'] = PL('t', '"FSCL"') // FIRE SUPPORT COORDINATION LINE (FSCL)
LABELS['G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
LABELS['G*F*LCN---'] = PL("'NFL'", 't') // NO-FIRE LINE (NFL)
LABELS['G*F*LCR---'] = PL('"RFL"', 't') // RESTRICTIVE FIRE LINE (RFL)
LABELS['G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
LABELS['G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
LABELS['G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
LABELS['G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
LABELS['G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
LABELS['G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
LABELS['G*O*B-----'] = MM('"B"') // BEARING LINE
LABELS['G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
LABELS['G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
LABELS['G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
LABELS['G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT
