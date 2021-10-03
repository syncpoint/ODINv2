import * as R from 'ramda'
import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles, Props } from '../styles'
import { transform } from '../../geometry'
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

const C = (text, options) => [{ 'text-field': text, 'text-anchor': 'center', 'text-clipping': 'none', ...options }]
const T = text => [{ 'text-field': text, 'text-anchor': 'top', 'text-padding': 3, 'text-clipping': 'line' }]
const B = text => [{ 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 3, 'text-clipping': 'line' }]
const F = text => [{ 'text-field': text, 'text-anchor': 'bottom', 'text-offset': [0, 20] }]
const LR = text => ['left', 'right'].map(anchor => ({ 'text-field': text, 'text-anchor': anchor, 'text-padding': 3, 'text-clipping': 'line' }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(anchor => ({ 'text-field': text, 'text-anchor': anchor, 'text-padding': 3, 'text-clipping': 'line' }))
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

styles['Polygon:DEFAULT'] = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }]
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
styles['LABELS:G*M*OGR---'] = C(ALL_LINES(), { 'text-clipping': 'actual', 'text-padding': 3 }) // OBSTACLE RESTRICTED AREA
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
  const ring = geometry.getExteriorRing()
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)

  const lazy = function (fn) {
    let evaluated = false
    let value

    return function () {
      if (evaluated) return value
      value = fn.apply(this, arguments)
      evaluated = true
      return value
    }
  }

  const xIntersection = lazy(() => {
    const axis = TS.lineString([
      TS.coordinate(envelope.getMinX(), centroid.y),
      TS.coordinate(envelope.getMaxX(), centroid.y)
    ])

    return geometry.intersection(axis).getCoordinates()
  })

  const yIntersection = lazy(() => {
    const axis = TS.lineString([
      TS.coordinate(centroid.x, envelope.getMinY()),
      TS.coordinate(centroid.x, envelope.getMaxY())
    ])

    return geometry.intersection(axis).getCoordinates()
  })

  const center = lazy(() => TS.point(centroid))
  const left = lazy(() => TS.point(xIntersection()[0]))
  const right = lazy(() => TS.point(xIntersection()[1]))
  const bottom = lazy(() => TS.point(yIntersection()[0]))
  const top = lazy(() => TS.point(yIntersection()[1]))

  const positions = { center, top, bottom, right, left }

  return options => {
    return options.map(label => {
      if (!Props.textField(label)) return label
      const anchor = Props.textAnchor(label)
      const geometry = positions[anchor]()
      if (!geometry) {
        console.warn('unknown anchor position', anchor)
        return label
      } else return { ...label, geometry }
    })
  }
}

styles.Polygon = ({ feature, resolution, mode }) => {
  const smoothGeometry = geometry => feature.get('style') && feature.get('style').smooth
    ? smooth(geometry)
    : geometry

  const { read, write } = transform(feature.getGeometry())
  const geometry = read(smoothGeometry(feature.getGeometry()))
  const sidc = feature.get('sidc')
  const key = parameterized(sidc) || 'DEFAULT'

  const writeGeometry = option => ({ ...option, geometry: write(option.geometry) })
  const styleFactory = makeStyles(feature, mode)

  // TODO: handles
  // TODO: guides
  // TODO: simplify: length > 50
  const pipeline = R.compose(
    options => options.map(styleFactory.makeStyle),
    options => options.map(writeGeometry),
    Clipping.clipLabels(resolution),
    options => options.map(styleFactory.evalTextField),
    options => options.filter(options => options.geometry),
    labelAnchors(geometry),
    options => (styles[key] || styles['Polygon:DEFAULT'])(options).concat((styles[`LABELS:${key}`] || []))
  )

  return [
    ...pipeline({ resolution, geometry })
  ]
}
