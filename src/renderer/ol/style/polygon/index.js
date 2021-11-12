import { styles } from '../styles'
import * as TS from '../../ts'
import Props from '../style-props'
import { lazy } from '../lazy'
import './G_G_GAF' // FORTIFIED AREA
import './G_G_PY' // // DECOY MINED AREA, FENCED
import './G_G_SAE' // ENCIRCLEMENT
import './G_M_OGB' // OBSTACLES / GENERAL / BELT
import './G_M_OGF' // OBSTACLE FREE AREA
import './G_M_OGR' // OBSTACLE RESTRICTED AREA
import './G_M_OGZ' // OBSTACLES / GENERAL / ZONE
import './G_M_SP' // STRONG POINT
import G_G_GAZ from '../resources/G_G_GAZ.png'

const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-clipping': 'none', ...options }]
const T = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'top', 'text-padding': 5, 'text-clipping': 'line' }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const F = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-offset': [0, 20] }]
const LR = text => ['left', 'right'].map(anchor => ({ id: 'style:default-text', 'text-field': text, 'text-anchor': anchor, 'text-padding': 5, 'text-clipping': 'line' }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(anchor => ({ id: 'style:default-text', 'text-field': text, 'text-anchor': anchor, 'text-padding': 5, 'text-clipping': 'line' }))
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

const G_G_PM = [
  ...TLBR('"M"'),
  { 'symbol-code': 'GFGPPD----', 'symbol-anchor': 'center', 'symbol-size': 100 }
]


styles['LABELS:GEOMETRY:POLYGON'] = geometry => {
  const ring = geometry.getExteriorRing()
  const envelope = ring.getEnvelopeInternal()
  const centroid = TS.centroid(ring)
  const [minX, maxX] = [envelope.getMinX(), envelope.getMaxX()]
  const [minY, maxY] = [envelope.getMinY(), envelope.getMaxY()]

  const xIntersection = lazy(() => {
    const coord = x => TS.coordinate(x, centroid.y)
    const axis = TS.lineString([minX, maxX].map(coord))
    return TS.intersection([geometry, axis]).getCoordinates()
  })

  const yIntersection = lazy(() => {
    const coord = y => TS.coordinate(centroid.x, y)
    const axis = TS.lineString([minY, maxY].map(coord))
    return TS.intersection([geometry, axis]).getCoordinates()
  })

  const fraction = anchor => {
    const lengthIndexedLine = TS.lengthIndexedLine(ring)
    const length = lengthIndexedLine.getEndIndex()
    const coord = lengthIndexedLine.extractPoint(anchor * length)
    return TS.point(coord)
  }

  const positions = {
    center: lazy(() => TS.point(centroid)),
    bottom: lazy(() => TS.point(yIntersection()[0])),
    top: lazy(() => TS.point(yIntersection()[1])),
    left: lazy(() => TS.point(xIntersection()[0])),
    right: lazy(() => TS.point(xIntersection()[1]))
  }

  return label => {
    const anchor = Props.textAnchor(label)
    const geometry = Number.isFinite(anchor)
      ? fraction(anchor)
      : positions[anchor || 'center']()

    return { geometry, ...label }
  }
}

styles.Polygon = id => ({ geometry, sidc }) => {
  if (!sidc) return [{ id: 'style:default', geometry }]
  const labels = (styles[`LABELS:${sidc}`] || [])
  return [
    { id, geometry },
    ...labels.map(styles['LABELS:GEOMETRY:POLYGON'](geometry))
  ]
}

styles['Polygon:DEFAULT'] = styles.Polygon('style:2525c/default-stroke')
styles['Polygon:FILL-HATCH'] = styles.Polygon('style:2525c/hatch-fill')

styles['LABELS:G*G*GAG---'] = C(ALL_LINES()) // GENERAL AREA
styles['LABELS:G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
styles['LABELS:G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
styles['LABELS:G*G*GAF---'] = C(ALL_LINES('')) // FORTIFIED AREA
styles['LABELS:G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
styles['LABELS:G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
styles['LABELS:G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
styles['LABELS:G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
styles['LABELS:G*G*GAY---'] = C('h', { 'text-halo-color': 'white', 'text-halo-width': 5 }) // LIMITED ACCESS AREA
styles['LABELS:G*G*GAZ---'] = [{ 'icon-url': G_G_GAZ, 'icon-anchor': 'center', 'icon-scale': 0.8 }] // AIRFIELD ZONE
styles['LABELS:G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
styles['LABELS:G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
styles['LABELS:G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
styles['LABELS:G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
styles['LABELS:G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
styles['LABELS:G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
styles['LABELS:G*G*AAW---'] = C(ALL_LINES('WFZ'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // WEAPONS FREE ZONE
styles['LABELS:G*G*PM----'] = G_G_PM // DECOY MINED AREA
styles['LABELS:G*G*PY----'] = G_G_PM // DECOY MINED AREA, FENCED
// TODO: G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
styles['LABELS:G*G*DAB---'] = C(ALL_LINES()) // BATTLE POSITION
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
styles['LABELS:G*M*OGZ---'] = C(ALL_LINES()) // GENERAL ZONE (OBSTACLES)
styles['LABELS:G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
styles['LABELS:G*M*OGR---'] = C(ALL_LINES(), { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }) // OBSTACLE RESTRICTED AREA
// TODO: G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
styles['LABELS:G*M*OFA---'] = TLBR('"M"') // MINED AREA
styles['LABELS:G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
styles['LABELS:G*M*SP----'] = C('t') // STRONG POINT
styles['LABELS:G*M*NL----'] = T('t') // DOSE RATE CONTOUR LINES
styles['LABELS:G*F*ACSR--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
styles['LABELS:G*F*ACAR--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
styles['LABELS:G*F*ACFR--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
styles['LABELS:G*F*ACNR--'] = C(ALL_LINES('NFA'), HALO) // NO-FIRE AREA (NFA)
styles['LABELS:G*F*ACRR--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
styles['LABELS:G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
styles['LABELS:G*F*ACER--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
styles['LABELS:G*F*ACDR--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
styles['LABELS:G*F*ACZR--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
styles['LABELS:G*F*ACBR--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
styles['LABELS:G*F*ACVR--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
styles['LABELS:G*F*AT----'] = C(ALL_LINES()) // AREA TARGET
styles['LABELS:G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
styles['LABELS:G*F*ATR---'] = C(ALL_LINES()) // RECTANGULAR TARGET
styles['LABELS:G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
styles['LABELS:G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
styles['LABELS:G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
styles['LABELS:G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
styles['LABELS:G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
styles['LABELS:G*F*ACNI--'] = C(ALL_LINES('NFA')) // NO-FIRE AREA (NFA)
styles['LABELS:G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
styles['LABELS:G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
styles['LABELS:G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
styles['LABELS:G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
styles['LABELS:G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
styles['LABELS:G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
styles['LABELS:G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
styles['LABELS:G*F*AKBR--'] = C(ALL_LINES('BKB'), HALO) // KILL BOX/BLUE
styles['LABELS:G*F*AKPR--'] = C(ALL_LINES('PKB'), HALO) // KILL BOX/PURPLE
styles['LABELS:G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
styles['LABELS:G*F*AZIR--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
styles['LABELS:G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
styles['LABELS:G*F*AZXR--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
styles['LABELS:G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
styles['LABELS:G*F*AZCR--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
styles['LABELS:G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
styles['LABELS:G*F*AZFR--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
styles['LABELS:G*F*AKBI--'] = C(ALL_LINES('BKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / BLUE
styles['LABELS:G*F*AKPI--'] = C(ALL_LINES('PKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / PURPLE
styles['LABELS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
styles['LABELS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
styles['LABELS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
styles['LABELS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
styles['LABELS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
styles['LABELS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
styles['LABELS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
styles['LABELS:G*M*NR----'] = [{ 'symbol-code': 'GFMPNZ----', 'symbol-anchor': 'center' }] // RADIOACTIVE AREA
styles['LABELS:G*M*NB----'] = [{ 'symbol-code': 'GFMPNEB---', 'symbol-anchor': 'center' }] // BIOLOGICALLY CONTAMINATED AREA
styles['LABELS:G*M*NC----'] = [{ 'symbol-code': 'GFMPNEC---', 'symbol-anchor': 'center' }] // CHEMICALLY CONTAMINATED AREA

styles['Polygon:G*F*ACNR--'] = styles['Polygon:FILL-HATCH'] // NO-FIRE AREA (NFA)
styles['Polygon:G*F*AKBI--'] = styles['Polygon:FILL-HATCH'] // KILL BOX / BLUE
styles['Polygon:G*F*AKPI--'] = styles['Polygon:FILL-HATCH'] // KILL BOX / PURPLE
styles['Polygon:G*G*AAW---'] = styles['Polygon:FILL-HATCH'] // LIMITED ACCESS AREA
styles['Polygon:G*G*GAY---'] = styles['Polygon:FILL-HATCH'] // LIMITED ACCESS AREA
styles['Polygon:G*M*NB----'] = styles['Polygon:FILL-HATCH'] // BIOLOGICALLY CONTAMINATED AREA
styles['Polygon:G*M*NC----'] = styles['Polygon:FILL-HATCH'] // CHEMICALLY CONTAMINATED AREA
styles['Polygon:G*M*NR----'] = styles['Polygon:FILL-HATCH'] // RADIOLOGICAL, AND NUCLEAR RADIOACTIVE AREA
styles['Polygon:G*F*AKBR--'] = styles['Polygon:FILL-HATCH'] // KILL BOX/BLUE
styles['Polygon:G*F*AKPR--'] = styles['Polygon:FILL-HATCH'] // KILL BOX/PURPLE
