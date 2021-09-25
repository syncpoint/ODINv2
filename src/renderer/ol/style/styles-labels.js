import * as R from 'ramda'
import * as geom from 'ol/geom'
import { containsXY } from 'ol/extent'
import { Jexl } from 'jexl'
import * as math from 'mathjs'
import { styles } from './styles'

// Text with (white) outline.
const textStrokeWidth = 3


const TOP = -25
const BOTTOM = 25

/*
    STATIC LABEL
    text :: Expression
    align :: 'start' | 'end' | 'left' | 'right' | 'center' | (0 <= fraction <= 1)
    offsetY :: number
    position (Polygon only) :: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'topRight' | 'topLeft'
*/

// ==> LineString labels.

const MT = text => [{ text, align: 0.5, offsetY: TOP }]
const MB = text => [{ text, align: 0.5, offsetY: BOTTOM }]
const MM = text => [{ text, align: 0.5, textStrokeWidth }]
const SE = text => ['start', 'end'].map(align => ({ text, align }))
const PL = title => ['start', 'end'].map(align => ({ text: [`"${title}"`, 't ? "(PL " + t + ")" : null'], align }))

const FSCL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  ['left', 'right'].map(align => ({ text: '(t ? t + " " : "") + "FSCL"', align, offsetY: TOP })),
  ['left', 'right'].map(align => ({ text: ['w', 'w1'], align, offsetY: BOTTOM }))
]

const CFL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  { text: '"CFL" + (t ? " " + t : "")', align: 0.5, offsetY: TOP },
  { text: ['w', 'w1'], align: 0.5, offsetY: BOTTOM }
]

const RFL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  ['left', 'right'].map(align => ({ text: '"RFL" + (t ? " " + t  : "")', align, offsetY: TOP })),
  ['left', 'right'].map(align => ({ text: ['w', 'w1'], align, offsetY: BOTTOM }))
]

const MFP = [
  { text: '"MFP"', align: 0.5, textStrokeWidth },
  { text: ['w', 'w1'], align: 'left', offsetY: BOTTOM }
]

styles['LABELS:LINE_STRING'] = []
styles['LABELS:G*T*A-----'] = [{ text: 't', align: 0.15 }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ text: 't', align: 0.15 }] // FOLLOW AND SUPPORT
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

// <== LineString labels.

// ==> Polygon labels.

const C = (text, textStrokeWidth) => [{ text, position: 'center', textStrokeWidth }]
const T = text => [{ text, position: 'top', textStrokeWidth }]
const B = text => [{ text, position: 'bottom', textStrokeWidth }]
const F = text => [{ text, position: 'footer', offsetY: 20 }]
const LR = text => ['left', 'right'].map(position => ({ text, position, textStrokeWidth }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(position => ({ text, position, textStrokeWidth }))
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
styles['LABELS:G*G*GAY---'] = C('h', textStrokeWidth) // LIMITED ACCESS AREA
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
styles['LABELS:G*M*OGR---'] = C(ALL_LINES(), textStrokeWidth) // OBSTACLE RESTRICTED AREA
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
styles['LABELS:G*F*AKBI--'] = C(ALL_LINES('BKB'), textStrokeWidth) // KILL BOX / BLUE
styles['LABELS:G*F*AKPI--'] = C(ALL_LINES('PKB'), textStrokeWidth) // KILL BOX / PURPLE
styles['LABELS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
styles['LABELS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
styles['LABELS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
styles['LABELS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
styles['LABELS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
styles['LABELS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
styles['LABELS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
styles['LABELS:G*M*NR----'] = [{ sidc: 'GFMPNZ----', position: 'center' }] // RADIOACTIVE AREA
styles['LABELS:G*M*NB----'] = [{ sidc: 'GFMPNEB---', position: 'center' }] // BIOLOGICALLY CONTAMINATED AREA
styles['LABELS:G*M*NC----'] = [{ sidc: 'GFMPNEC---', position: 'center' }] // CHEMICALLY CONTAMINATED AREA

// <== Polygon labels.

const jexl = new Jexl()
const atan2 = delta => Math.atan2(delta[0], delta[1])
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const segmentAngle = R.compose(atan2, vector)
const isAlign = v => ({ align }) => align === v

const textAlign = {
  left: 'end',
  right: 'start',
  start: 'start',
  end: 'end',
  center: 'center'
}

const offsetX = { start: 15, end: -15 }

const text = (properties, { text }) => Array.isArray(text)
  ? text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
  : jexl.evalSync(text, properties)


/**
 * Horizontal and vertical label placement
 *
 * vertical/horizontal
 *
 *                 LEFT  START      <-- FRACTION -->    END  RIGHT
 * TOP                |  |                 |              |  |
 *                    |  |                 |              |  |
 * MIDDLE             |  +-----------------|--------------+  |
 *                    |  P1                |              P2 |
 * BOTTOM             |  |                 |              |  |
 */
const lineString = (geometry, properties) => {
  const segments = R.aperture(2, geometry.getCoordinates())

  const segment = fraction => [
    geometry.getCoordinateAt(fraction - 0.05),
    geometry.getCoordinateAt(fraction + 0.05)
  ]

  const angle = R.cond([
    [isAlign('right'), R.always(segmentAngle(R.head(segments)))],
    [isAlign('end'), R.always(segmentAngle(R.head(segments)))],
    [isAlign('start'), R.always(segmentAngle(R.last(segments)))],
    [isAlign('left'), R.always(segmentAngle(R.last(segments)))],
    [R.T, ({ align }) => segmentAngle(segment(align))]
  ])

  const coordinate = R.cond([
    [isAlign('end'), R.always(geometry.getFirstCoordinate())],
    [isAlign('right'), R.always(geometry.getFirstCoordinate())],
    [isAlign('start'), R.always(geometry.getLastCoordinate())],
    [isAlign('left'), R.always(geometry.getLastCoordinate())],
    [R.T, ({ align }) => geometry.getCoordinateAt(align)]
  ])

  return labels => {
    if (!labels || !labels.length) return []

    const textLabels = labels.filter(({ text }) => text)
    const options = textLabels.map(label => {
      return {
        geometry: new geom.Point(coordinate(label)),
        textOptions: {
          angle: angle(label),
          text: text(properties, label),
          textAlign: textAlign[label.align] || null,
          offsetY: label.offsetY || 0,
          offsetX: offsetX[label.align] || 0
        }
      }
    })

    return options
  }
}


/**
 *
 */
const polygon = (geometry, properties) => {
  const ring = geometry.getLinearRing(0)
  const box = ring.getExtent()
  const coords = ring.getCoordinates()

  const positions = {}
  positions.center = geometry.getInteriorPoint()
  const centerCoords = positions.center.getCoordinates() // XYM layout
  positions.footer = new geom.Point([centerCoords[0], box[1]])


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

  const calculate = ({ position }) => {
    switch (position) {
      case 'topRight': return topRightLeft()
      case 'topLeft': return topRightLeft()
      case 'left': return hIntersect()
      case 'right': return hIntersect()
      case 'top': return vIntersect()
      case 'bottom': return vIntersect()
    }
  }

  const textOptions = label => ({
    text: text(properties, label),
    textAlign: label.textAlign,
    offsetY: label.offsetY,
    offsetX: label.offsetX
  })

  const symbolOptions = label => ({
    sidc: label.sidc
  })

  return labels => {
    if (!labels || !labels.length) return []

    return labels.map(label => {
      if (!positions[label.position]) calculate(label.position)
      if (!positions[label.position]) return null
      const geometry = positions[label.position]

      return label.text
        ? { geometry, textOptions: textOptions(label) }
        : { geometry, symbolOptions: symbolOptions(label) }
    })
  }
}

export const styleOptions = (geometry, properties) =>
  geometry.getType() === 'LineString'
    ? lineString(geometry, properties)
    : polygon(geometry, properties)
