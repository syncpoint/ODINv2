import * as R from 'ramda'
import * as geom from 'ol/geom'
import { Jexl } from 'jexl'
import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles, makeMilitaryStyles, Props } from '../styles'
import * as Clipping from '../clipping'
import { transform } from './commons'
import { smooth } from '../chaikin'
import * as TS from '../../ts'

/* eslint-disable no-multi-spaces */
import './G_F_LT'    // LINEAR TARGET, FINAL PROTECTIVE FIRE (FPF) and LINEAR SMOKE TARGET
import './G_G_ALx'   // AVIATION / LINES
import './G_G_GLB'   // BOUNDARIES
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

const LEFT_END = { 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-15, 0], 'text-padding': 5 }
const RIGHT_START = { 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [15, 0], 'text-padding': 5 }
const ABOVE_LEFT_START = { 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const ABOVE_RIGHT_END = { 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const BELOW_LEFT_START = { 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, BELOW] }
const BELOW_RIGHT_END = { 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, BELOW] }
const MT = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }]
const MB = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }]
const MM = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const SE = text => [LEFT_END, RIGHT_START].map(props => ({ 'text-field': text, ...props }))
const PL = title => [LEFT_END, RIGHT_START].map(props => ({ 'text-field': [`"${title}"`, 't ? "(PL " + t + ")" : null'], ...props }))
const FSCL_1 = [LEFT_END, RIGHT_START].map(props => ({ 'text-field': '"PL" + (t1 ? " " + t1 : "")', ...props }))
const FSCL_2 = [ABOVE_LEFT_START, ABOVE_RIGHT_END].map(props => ({ 'text-field': '(t ? t + " " : "") + "FSCL"', ...props }))
const FSCL_3 = [BELOW_LEFT_START, BELOW_RIGHT_END].map(props => ({ 'text-field': ['w', 'w1'], ...props }))
const FSCL = [FSCL_1, FSCL_2, FSCL_3]
const CFL_1 = [LEFT_END, RIGHT_START].map(props => ({ 'text-field': '"PL" + (t1 ? " " + t1 : "")', 'text-padding': 5, ...props }))
const CFL_2 = { 'text-field': '"CFL" + (t ? " " + t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_3 = { 'text-field': ['w', 'w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2, CFL_3]
const RFL_2 = [ABOVE_LEFT_START, ABOVE_RIGHT_END].map(props => ({ 'text-field': '"RFL" + (t ? " " + t  : "")', ...props }))
const RFL = [FSCL_1, RFL_2, FSCL_3]
const MFP_1 = { 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1, FSCL_3]

styles['LABELS:LINE_STRING'] = []
styles['LABELS:G*T*A-----'] = [{ 'text-field': 't', 'text-anchor': 0.15 }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ 'text-field': 't', 'text-anchor': 0.15 }] // FOLLOW AND SUPPORT
styles['LABELS:G*G*GLP---'] = SE('t ? "PL " + t : "PL"') // PHASE LINE
styles['LABELS:G*G*GLL---'] = PL('LL') // LIGHT LINE
styles['LABELS:G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
styles['LABELS:G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
styles['LABELS:G*G*OLF---'] = PL('FINAL CL') // FINAL COORDINATION LINE
styles['LABELS:G*G*OLL---'] = PL('LOA') // LIMIT OF ADVANCE
styles['LABELS:G*G*OLT---'] = PL('LD') // LINE OF DEPARTURE
styles['LABELS:G*G*OLC---'] = PL('LD/LC') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
styles['LABELS:G*G*OLP---'] = PL('PLD') // PROBABLE LINE OF DEPLOYMENT (PLD)
styles['LABELS:G*G*SLH---'] = SE('(t ? "PL " + t + "\n" : "") + "HOLDING LINE"') // HOLDING LINE
styles['LABELS:G*G*SLR---'] = PL('RL') // RELEASE LINE
styles['LABELS:G*G*SLB---'] = SE('(t ? "PL " + t + "\n" : "") + "BRIDGEHEAD LINE"') // BRIDGEHEAD
styles['LABELS:G*F*LT----'] = MT('t') // LINEAR TARGET
styles['LABELS:G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
styles['LABELS:G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
styles['LABELS:G*F*LCF---'] = FSCL // FIRE SUPPORT COORDINATION LINE (FSCL)
styles['LABELS:G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
styles['LABELS:G*F*LCN---'] = PL('NFL') // NO-FIRE LINE (NFL)
styles['LABELS:G*F*LCR---'] = RFL // RESTRICTIVE FIRE LINE (RFL)
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


/**
 *
 */
const labelAnchors = geometry => {
  const atan2 = delta => Math.atan2(delta[0], delta[1])
  const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
  const segmentAngle = R.compose(atan2, vector)
  const segments = R.aperture(2, geometry.getCoordinates())

  const segment = fraction => [
    geometry.getCoordinateAt(fraction - 0.05),
    geometry.getCoordinateAt(fraction + 0.05)
  ]

  const angle = label => {
    const anchor = Props.textAnchor(label)

    if (isNaN(anchor)) {
      if (anchor.includes('center')) return segmentAngle(segment(0.5))
      else if (anchor.includes('left')) return segmentAngle(R.head(segments))
      else if (anchor.includes('right')) return segmentAngle(R.last(segments))
    } else segmentAngle(segment(anchor))
  }

  const anchor = label => {
    const anchor = Props.textAnchor(label)
    if (isNaN(anchor)) {
      if (anchor.includes('center')) return geometry.getCoordinateAt(0.5)
      else if (anchor.includes('left')) return geometry.getFirstCoordinate()
      else if (anchor.includes('right')) return geometry.getLastCoordinate()
      else return geometry.getCoordinateAt(0.5)
    } else return geometry.getCoordinateAt(anchor)
  }

  return label => ({
    geometry: new geom.Point(anchor(label)),
    'text-rotate': TS.Angle.normalize(TS.Angle.PI_TIMES_2 - angle(label))
  })
}

const jexl = new Jexl()
export const textFields = properties => label => {
  const text = Props.textField(label)
  return Array.isArray(text)
    ? text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
    : jexl.evalSync(text, properties)
}


styles.LineString = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const styleFactory = makeStyles(feature, mode)
  const geometry = feature.getGeometry()
  const properties = feature.getProperties()

  const simplifiedGeometry = geometry.getCoordinates().length > 100
    ? geometry.simplify(resolution)
    : geometry

  const smoothedGeometry = feature.get('style') && feature.get('style').smooth
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  const anchor = labelAnchors(smoothedGeometry)
  const textField = textFields(properties)
  const labels = (styles[`LABELS:${key}`] || [])
    .flat()
    .map(label => ({
      ...label,
      ...anchor(label),
      'text-field': textField(label),
      'text-font': Props.textFont(label) || styleFactory.font()
    }))

  const clipBoxes = labels.map(Clipping.boundingBox(resolution))
  const clippedGeometry = (() => {
    const geometry = TS.read(smoothedGeometry)
    const boxes = clipBoxes.map(TS.read)
    return TS.write(TS.difference([geometry, ...boxes]))
  })()

  const militaryStyle = makeMilitaryStyles(feature)
  const style = styles[`LineString:${key}`]
    ? transform(styles[`LineString:${key}`])({
      feature,
      geometry: smoothedGeometry,
      resolution,
      styles: styleFactory
    })
    : styleFactory.lineStyle(clippedGeometry, militaryStyle)

  return [
    ...style,
    ...labels.map(styleFactory.label),
    ...styleFactory.handles(simplifiedGeometry),
    ...styleFactory.guideStroke(simplifiedGeometry)
  ]
}
