import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import Props from '../style-props'

/* eslint-disable no-multi-spaces */
import './G_F_LT'    // LINEAR TARGET, FINAL PROTECTIVE FIRE (FPF) and LINEAR SMOKE TARGET
import './G_G_ALx'   // AVIATION / LINES
import './G_G_GLC'   // LINE OF CONTACT
import './G_G_GLF'   // FORWARD LINE OF OWN TROOPS (FLOT)
import './G_G_OLKA'  // DIRECTION OF ATTACK / AVIATION
import './G_G_OLKGM' // DIRECTION OF ATTACK / MAIN ATTACK
import './G_G_OLKGS' // DIRECTION OF ATTACK / SUPPORTING ATTACK
import './G_G_PF'    // DIRECTION OF ATTACK FOR FEINT
import './G_M_BCF'   // FERRY
import './G_M_BCL'   // LANE
import './G_M_BCR'   // RAFT SITE
import './G_M_OADx'  // ANTITANK DITCH / UNDER CONSTRUCTION and ... COMPLETE
import './G_M_OAR'   // ANTITANK DITCH REINFORCED WITH ANTITANK MINES
import './G_M_OEF'   // OBSTACLE EFFECT / FIX
import './G_M_OGL'   // OBSTACLES / GENERAL / LINE and ANTITANK WALL
import './G_M_OMC'   // MINE CLUSTER
import './G_M_OS'    // ABATIS
import './G_M_OWA'   // DOUBLE APRON FENCE
import './G_M_OWCD'  // DOUBLE STRAND CONCERTINA
import './G_M_OWCS'  // SINGLE CONCERTINA
import './G_M_OWCT'  // TRIPLE STRAND CONCERTINA
import './G_M_OWD'   // DOUBLE FENCE
import './G_M_OWH'   // HIGH WIRE FENCE
import './G_M_OWL'   // LOW WIRE FENCE
import './G_M_OWS'   // SINGLE FENCE
import './G_M_OWU'   // UNSPECIFIED FENCE
import './G_M_SL'    // FORTIFIED LINE
import './G_M_SW'    // FOXHOLE, EMPLACEMENT OR WEAPON SITE
import './G_O_HN'    // HAZARD / NAVIGATIONAL
import './G_S_LCH'   // HALTED CONVOY
import './G_S_LCM'   // MOVING CONVOY
import './G_T_A'     // FOLLOW AND ASSUME
import './G_T_AS'    // FOLLOW AND SUPPORT
import './G_T_F'     // TASKS / FIX
/* eslint-enable no-multi-spaces */

const ABOVE = -20
const BELOW = 20

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

const W = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-10, 0], 'text-padding': 5 }
const E = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [10, 0], 'text-padding': 5 }
const NNW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [10, -15] }
const NNE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [-10, -15] }
const SSW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [10, BELOW] }
const SSE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [-10, BELOW] }
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

styles['LABELS:GEOMETRY:LINE_STRING'] = geometry => {
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

  const anchorPoint = anchor => {
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return pointAt(0.5)
      else if (anchor.includes('left')) return geometry.getPointN(0)
      else if (anchor.includes('right')) return geometry.getPointN(numPoints - 1)
      else return pointAt(0.5)
    } else return pointAt(anchor)
  }

  const normalize = angle => TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle)

  return label => {
    // text-field or icon-image
    const textField = Props.textField(label)
    const anchor = Props.textAnchor(label) ||
      Props.symbolAnchor(label) ||
      Props.iconAnchor(label) ||
      // anchor is optional for text labels
      (textField ? 'center' : null)

    if (anchor === null) return label

    const result = { ...label }
    const geometry = anchorPoint(anchor)
    if (geometry) result.geometry = geometry

    const rotate = angle(anchor)
    if (rotate !== null) {
      const property = Props.textAnchor(label)
        ? 'text-rotate'
        : 'icon-rotate'
      result[property] = normalize(rotate)
    }

    return result
  }
}

const lineString = id => ({ geometry, sidc }) => {
  if (!sidc) return [{ id: 'style:default', geometry }]
  const labels = (styles[`LABELS:${sidc}`] || []).flat()
  return [
    { id, geometry },
    ...labels.map(styles['LABELS:GEOMETRY:LINE_STRING'](geometry))
  ]
}

styles['LineString:DEFAULT'] = lineString('style:2525c/default-stroke')
styles['LineString:DASHED'] = lineString('style:2525c/dashed-stroke')

styles['LABELS:G*T*A-----'] = [{ id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
styles['LABELS:G*G*GLB---'] = BND // BOUNDARIES
styles['LABELS:G*G*GLP---'] = PL() // PHASE LINE
styles['LABELS:G*G*GLL---'] = PL('"LL"', 't') // LIGHT LINE
styles['LABELS:G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
styles['LABELS:G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
styles['LABELS:G*G*OLF---'] = PL('"FCL"', 't') // FINAL COORDINATION LINE
styles['LABELS:G*G*OLL---'] = PL('"LOA"', 't') // LIMIT OF ADVANCE
styles['LABELS:G*G*OLT---'] = PL('"LD"', 't') // LINE OF DEPARTURE
styles['LABELS:G*G*OLC---'] = PL('"LD/LC"', 't') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
styles['LABELS:G*G*OLP---'] = PL('"PLD"', 't') // PROBABLE LINE OF DEPLOYMENT (PLD)
styles['LABELS:G*G*SLH---'] = NNEW('"HL"', { 'text-offset': [0, -10] }) // HOLDING LINE
styles['LABELS:G*G*SLR---'] = PL('"RL"', 't') // RELEASE LINE
styles['LABELS:G*G*SLB---'] = NNEW('"BL"', { 'text-offset': [0, -10] }) // BRIDGEHEAD
styles['LABELS:G*F*LT----'] = MT('t') // LINEAR TARGET
styles['LABELS:G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
styles['LABELS:G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
styles['LABELS:G*F*LCF---'] = PL('t', '"FSCL"') // FIRE SUPPORT COORDINATION LINE (FSCL)
styles['LABELS:G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
styles['LABELS:G*F*LCN---'] = PL("'NFL'", 't') // NO-FIRE LINE (NFL)
styles['LABELS:G*F*LCR---'] = PL('"RFL"', 't') // RESTRICTIVE FIRE LINE (RFL)
styles['LABELS:G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
styles['LABELS:G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
styles['LABELS:G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
styles['LABELS:G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
styles['LABELS:G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
styles['LABELS:G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
styles['LABELS:G*O*B-----'] = MM('"B"') // BEARING LINE
styles['LABELS:G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
styles['LABELS:G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
styles['LABELS:G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
styles['LABELS:G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT
