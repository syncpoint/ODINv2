import * as R from 'ramda'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import * as math from 'mathjs'
import { Jexl } from 'jexl'
import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles, makeMilitaryStyles, Props } from '../styles'
import './G_G_GAF' // FORTIFIED AREA
import './G_G_SAE' // ENCIRCLEMENT
import './G_M_OGB' // OBSTACLES / GENERAL / BELT
import './G_M_OGF' // OBSTACLE FREE AREA
import './G_M_OGR' // OBSTACLE RESTRICTED AREA
import './G_M_OGZ' // OBSTACLES / GENERAL / ZONE
import './G_M_SP' // STRONG POINT
import { smooth } from '../chaikin'
import * as Clipping from '../clipping'
import * as TS from '../../ts'

const C = text => [{ 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const T = text => [{ 'text-field': text, 'text-anchor': 'top' }]
const B = text => [{ 'text-field': text, 'text-anchor': 'bottom' }]
const F = text => [{ 'text-field': text, 'text-anchor': 'below', offsetY: 20 }]
const LR = text => ['left', 'right'].map(anchor => ({ 'text-field': text, 'text-anchor': anchor, 'text-padding': 5 }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(anchor => ({ 'text-field': text, 'text-anchor': anchor, 'text-padding': 5 }))
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

styles['LABELS:POLYGON'] = C(ALL_LINES())
styles['LABELS:G*G*GAG---'] = styles['LABELS:POLYGON'] // GENERAL AREA
styles['LABELS:G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
styles['LABELS:G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
styles['LABELS:G*G*GAF---'] = C(ALL_LINES('')) // FORTIFIED AREA
styles['LABELS:G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
styles['LABELS:G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
styles['LABELS:G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
styles['LABELS:G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
styles['LABELS:G*G*GAY---'] = C('h') // LIMITED ACCESS AREA
// TODO: G*G*GAZ--- : AIRFIELD ZONE
styles['LABELS:G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
styles['LABELS:G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
styles['LABELS:G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
styles['LABELS:G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
styles['LABELS:G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
styles['LABELS:G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
styles['LABELS:G*G*AAW---'] = C(ALL_LINES('WFZ')) // WEAPONS FREE ZONE
styles['LABELS:G*G*PM----'] = TLBR('"M"') // DECOY MINED AREA
// TODO: G*G*PY---- : DECOY MINED AREA, FENCED
// TODO: G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
styles['LABELS:G*G*DAB---'] = styles['LABELS:POLYGON'] // BATTLE POSITION
styles['LABELS:G*G*DABP--'] = C('t ? "(P) " + t : (P)') // BATTLE POSITION / PREPARED BUT NOT OCCUPIED
styles['LABELS:G*G*DAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA (DEFENSE)
styles['LABELS:G*G*OAA---'] = C(ALL_LINES('ASLT\nPSN')) // ASSAULT POSITION
styles['LABELS:G*G*OAK---'] = C(ALL_LINES('ATK')) // ATTACK POSITION
styles['LABELS:G*G*OAO---'] = C(ALL_LINES('OBJ')) // OBJECTIVE (OFFENSE)
styles['LABELS:G*G*OAP---'] = [] // PENETRATION BOX
styles['LABELS:G*G*SAO---'] = C(ALL_LINES('AO')) // AREA OF OPERATIONS (AO)
styles['LABELS:G*G*SAA---'] = F(['"AIRHEAD LINE"', 't ? "(PL " + t + ")" : null']) // AIRHEAD
styles['LABELS:G*G*SAE---'] = C(ALL_LINES()) // ENCIRCLEMENT
styles['LABELS:G*G*SAN---'] = C(ALL_LINES('NAI')) // NAMED AREA OF INTEREST (NAI)
styles['LABELS:G*G*SAT---'] = C(ALL_LINES('TAI')) // TARGETED AREA OF INTEREST (TAI)
styles['LABELS:G*M*OGB---'] = C(['t', 't1']) // BELT (OBSTACLES)
styles['LABELS:G*M*OGZ---'] = styles['LABELS:POLYGON'] // GENERAL ZONE (OBSTACLES)
styles['LABELS:G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
styles['LABELS:G*M*OGR---'] = C(ALL_LINES()) // OBSTACLE RESTRICTED AREA
// TODO: G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
styles['LABELS:G*M*OFA---'] = TLBR('"M"') // MINED AREA
styles['LABELS:G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
styles['LABELS:G*M*SP----'] = C('t') // STRONG POINT
styles['LABELS:G*M*NL----'] = T('t') // DOSE RATE CONTOUR LINES
styles['LABELS:G*F*AT----'] = styles['LABELS:POLYGON'] // AREA TARGET
// TODO: G*F*ATR--- : RECTANGULAR TARGET
styles['LABELS:G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
styles['LABELS:G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
styles['LABELS:G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
styles['LABELS:G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
styles['LABELS:G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
styles['LABELS:G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
styles['LABELS:G*F*ACNI--'] = C(ALL_LINES('NFA')) // NO-FIRE AREA (NFA)
styles['LABELS:G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
styles['LABELS:G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
styles['LABELS:G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
styles['LABELS:G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
styles['LABELS:G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
styles['LABELS:G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
styles['LABELS:G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
styles['LABELS:G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
styles['LABELS:G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
styles['LABELS:G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
styles['LABELS:G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
styles['LABELS:G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRI'end'LY ZONE (CFZ)
styles['LABELS:G*F*AKBI--'] = C(ALL_LINES('BKB')) // KILL BOX / BLUE
styles['LABELS:G*F*AKPI--'] = C(ALL_LINES('PKB')) // KILL BOX / PURPLE
styles['LABELS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
styles['LABELS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
styles['LABELS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
styles['LABELS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
styles['LABELS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
styles['LABELS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
styles['LABELS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
styles['LABELS:G*M*NR----'] = [{ sidc: 'GFMPNZ----', 'text-anchor': 'center' }] // RADIOACTIVE AREA
styles['LABELS:G*M*NB----'] = [{ sidc: 'GFMPNEB---', 'text-anchor': 'center' }] // BIOLOGICALLY CONTAMINATED AREA
styles['LABELS:G*M*NC----'] = [{ sidc: 'GFMPNEC---', 'text-anchor': 'center' }] // CHEMICALLY CONTAMINATED AREA
styles['FILL:HATCH'] = { pattern: 'hatch', angle: 45, size: 4, spacing: 12 }
styles['FILL:G*G*GAY---'] = styles['FILL:HATCH'] // LIMITED ACCESS AREA
styles['FILL:G*M*OGR---'] = styles['FILL:HATCH'] // OBSTACLE RESTRICTED AREA
styles['FILL:G*M*NB----'] = styles['FILL:HATCH'] // BIOLOGICALLY CONTAMINATED AREA
styles['FILL:G*M*NC----'] = styles['FILL:HATCH'] // CHEMICALLY CONTAMINATED AREA
styles['FILL:G*M*NR----'] = styles['FILL:HATCH'] // RADIOLOGICAL, AND NUCLEAR RADIOACTIVE AREA
styles['FILL:G*F*AKBI--'] = styles['FILL:HATCH'] // KILL BOX / BLUE
styles['FILL:G*F*AKPI--'] = styles['FILL:HATCH'] // KILL BOX / PURPLE

const labelAnchors = geometry => {
  const ring = geometry.getLinearRing(0)
  const box = ring.getExtent()
  const coords = ring.getCoordinates()

  const positions = {}
  positions.center = geometry.getInteriorPoint()
  const centerCoords = positions.center.getCoordinates() // XYM layout
  positions.below = new geom.Point([centerCoords[0], box[1]])


  /**
   * segmentIntersect :: ([x, y], [x, y]) -> [[x0, y0], [x1, y1]] -> [x, y]
   * Intersection point of two line segments yz and segment.
   */
  const segmentIntersect = (y, z) => segment => {
    const intersection = math.intersect(segment[0], segment[1], y, z)
    if (!intersection) return []
    const extent = new geom.LineString(segment).getExtent()
    if (!containsXY(extent, intersection[0], intersection[1])) return []
    return [intersection]
  }

  /**
   * axisIntersect :: ([[x, y]], [x, y], [x, y]) -> [[x, y]] -> [[x, y]]
   * Maximum of two intersection points of line segment yz
   * with all segments formed by points.
   */
  const axisIntersect = (points, y, z) => R
    .aperture(2, points)
    .map(segment => segmentIntersect(y, z)(segment))
    .reduce((acc, intersections) => acc.concat(intersections), [])

  const topRightLeft = function () {
    const y = box[1] + (box[3] - box[1]) * 0.95
    const xs = axisIntersect(coords, [box[0], y], [box[2], y])

    if (xs.length !== 2) return
    positions.topRight = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
    positions.topLeft = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
  }

  const hIntersect = function () {
    const xs = axisIntersect(
      coords,
      [box[0], centerCoords[1]], [box[2], centerCoords[1]]
    )

    if (xs.length !== 2) return
    positions.right = new geom.Point(xs[0][0] > xs[1][0] ? xs[0] : xs[1])
    positions.left = new geom.Point(xs[0][0] > xs[1][0] ? xs[1] : xs[0])
  }

  const vIntersect = function () {
    const xs = axisIntersect(
      coords,
      [centerCoords[0], box[1]], [centerCoords[0], box[3]]
    )

    if (xs.length !== 2) return
    positions.bottom = new geom.Point(xs[0][1] > xs[1][1] ? xs[1] : xs[0])
    positions.top = new geom.Point(xs[0][1] > xs[1][1] ? xs[0] : xs[1])
  }

  const calculate = anchor => {
    switch (anchor) {
      case 'top-right': return topRightLeft()
      case 'top-left': return topRightLeft()
      case 'left': return hIntersect()
      case 'right': return hIntersect()
      case 'top': return vIntersect()
      case 'bottom': return vIntersect()
    }
  }

  return label => {
    const anchor = Props.textAnchor(label)
    if (!positions[anchor]) calculate(anchor)
    if (!positions[anchor]) return null
    return { geometry: positions[anchor] }
  }
}

const jexl = new Jexl()
export const textFields = properties => label => {
  const text = Props.textField(label)
  return Array.isArray(text)
    ? text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
    : jexl.evalSync(text, properties)
}

styles.Polygon = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const styleFactory = makeStyles(feature, mode)
  const geometry = feature.getGeometry()
  const properties = feature.getProperties()

  const simplifiedGeometry = geometry.getCoordinates()[0].length > 50
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

  const clipBoxes = labels.map(Clipping.boundingBox(resolution)).filter(Boolean)
  const clippedGeometry = (() => {
    const polygon = TS.read(smoothedGeometry)
    const lineString = TS.lineString(polygon.getCoordinates())
    const boxes = clipBoxes.map(TS.read)
    return TS.write(TS.difference([lineString, ...boxes]))
  })()

  const style = styles[key]
    ? styles[key]({ feature, resolution, styles: styleFactory, geometry: smoothedGeometry })
    : [['style:2525c/default-stroke', clippedGeometry]]

  return [
    ...style.map(styleFactory.makeStyle),
    ...labels.map(styleFactory.label),
    ...styleFactory.handles(simplifiedGeometry),
    ...styleFactory.guideStroke(simplifiedGeometry)
  ]
}
