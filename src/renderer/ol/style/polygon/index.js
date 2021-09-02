import * as R from 'ramda'
import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles } from '../styles'
import { PolygonLabels } from '../labels'
import './G_G_GAF' // FORTIFIED AREA
import './G_G_GAY' // LIMITED ACCESS AREA
import './G_G_SAE' // ENCIRCLEMENT
import './G_M_OGB' // OBSTACLES / GENERAL / BELT
import './G_M_OGF' // OBSTACLE FREE AREA
import './G_M_OGR' // OBSTACLE RESTRICTED AREA
import './G_M_OGZ' // OBSTACLES / GENERAL / ZONE
import './G_M_SP' // STRONG POINT
import { smooth } from '../chaikin'

const textStrokeWidth = 3
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

styles['TEXTS:POLYGON'] = C(ALL_LINES())
styles['TEXTS:G*G*GAG---'] = styles['TEXTS:POLYGON'] // GENERAL AREA
styles['TEXTS:G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
styles['TEXTS:G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
styles['TEXTS:G*G*GAF---'] = C(ALL_LINES('')) // FORTIFIED AREA
styles['TEXTS:G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
styles['TEXTS:G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
styles['TEXTS:G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
styles['TEXTS:G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
styles['TEXTS:G*G*GAY---'] = C('h', textStrokeWidth) // LIMITED ACCESS AREA
// TODO: G*G*GAZ--- : AIRFIELD ZONE
styles['TEXTS:G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
styles['TEXTS:G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
styles['TEXTS:G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
styles['TEXTS:G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
styles['TEXTS:G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
styles['TEXTS:G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
styles['TEXTS:G*G*AAW---'] = C(ALL_LINES('WFZ')) // WEAPONS FREE ZONE
styles['TEXTS:G*G*PM----'] = TLBR('"M"') // DECOY MINED AREA
// TODO: G*G*PY---- : DECOY MINED AREA, FENCED
// TODO: G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
styles['TEXTS:G*G*DAB---'] = styles['TEXTS:POLYGON'] // BATTLE POSITION
styles['TEXTS:G*G*DABP--'] = C('t ? "(P) " + t : (P)') // BATTLE POSITION / PREPARED BUT NOT OCCUPIED
styles['TEXTS:G*G*DAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA (DEFENSE)
styles['TEXTS:G*G*OAA---'] = C(ALL_LINES('ASLT\nPSN')) // ASSAULT POSITION
styles['TEXTS:G*G*OAK---'] = C(ALL_LINES('ATK')) // ATTACK POSITION
styles['TEXTS:G*G*OAO---'] = C(ALL_LINES('OBJ')) // OBJECTIVE (OFFENSE)
styles['TEXTS:G*G*OAP---'] = [] // PENETRATION BOX
styles['TEXTS:G*G*SAO---'] = C(ALL_LINES('AO')) // AREA OF OPERATIONS (AO)
styles['TEXTS:G*G*SAA---'] = F(['"AIRHEAD LINE"', 't ? "(PL " + t + ")" : null']) // AIRHEAD
styles['TEXTS:G*G*SAE---'] = C(ALL_LINES()) // ENCIRCLEMENT
styles['TEXTS:G*G*SAN---'] = C(ALL_LINES('NAI')) // NAMED AREA OF INTEREST (NAI)
styles['TEXTS:G*G*SAT---'] = C(ALL_LINES('TAI')) // TARGETED AREA OF INTEREST (TAI)
styles['TEXTS:G*M*OGB---'] = C(['t', 't1']) // BELT (OBSTACLES)
styles['TEXTS:G*M*OGZ---'] = styles['TEXTS:POLYGON'] // GENERAL ZONE (OBSTACLES)
styles['TEXTS:G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
styles['TEXTS:G*M*OGR---'] = C(ALL_LINES(), textStrokeWidth) // OBSTACLE RESTRICTED AREA
// TODO: G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
styles['TEXTS:G*M*OFA---'] = TLBR('"M"') // MINED AREA
styles['TEXTS:G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
styles['TEXTS:G*M*SP----'] = C('t') // STRONG POINT
styles['TEXTS:G*M*NL----'] = T('t') // DOSE RATE CONTOUR LINES
styles['TEXTS:G*F*AT----'] = styles['TEXTS:POLYGON'] // AREA TARGET
// TODO: G*F*ATR--- : RECTANGULAR TARGET
styles['TEXTS:G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
styles['TEXTS:G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
styles['TEXTS:G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
styles['TEXTS:G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
styles['TEXTS:G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
styles['TEXTS:G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
styles['TEXTS:G*F*ACNI--'] = C(ALL_LINES('NFA')) // NO-FIRE AREA (NFA)
styles['TEXTS:G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
styles['TEXTS:G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
styles['TEXTS:G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
styles['TEXTS:G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
styles['TEXTS:G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
styles['TEXTS:G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
styles['TEXTS:G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
styles['TEXTS:G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
styles['TEXTS:G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
styles['TEXTS:G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
styles['TEXTS:G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
styles['TEXTS:G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
styles['TEXTS:G*F*AKBI--'] = C(ALL_LINES('BKB'), textStrokeWidth) // KILL BOX / BLUE
styles['TEXTS:G*F*AKPI--'] = C(ALL_LINES('PKB'), textStrokeWidth) // KILL BOX / PURPLE
styles['TEXTS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
styles['TEXTS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
styles['TEXTS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
styles['TEXTS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
styles['TEXTS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
styles['TEXTS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
styles['TEXTS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
styles['TEXTS:G*M*NR----'] = [{ symbol: 'GFMPNZ----', position: 'center' }] // RADIOACTIVE AREA
styles['TEXTS:G*M*NB----'] = [{ symbol: 'GFMPNEB---', position: 'center' }] // BIOLOGICALLY CONTAMINATED AREA
styles['TEXTS:G*M*NC----'] = [{ symbol: 'GFMPNEC---', position: 'center' }] // CHEMICALLY CONTAMINATED AREA
styles['FILL:HATCH'] = { pattern: 'hatch', angle: 45, size: 2, spacing: 12 }
styles['FILL:G*G*GAY---'] = styles['FILL:HATCH'] // LIMITED ACCESS AREA
styles['FILL:G*M*OGR---'] = styles['FILL:HATCH'] // OBSTACLE RESTRICTED AREA
styles['FILL:G*M*NB----'] = styles['FILL:HATCH'] // BIOLOGICALLY CONTAMINATED AREA
styles['FILL:G*M*NC----'] = styles['FILL:HATCH'] // CHEMICALLY CONTAMINATED AREA
styles['FILL:G*M*NR----'] = styles['FILL:HATCH'] // RADIOLOGICAL, AND NUCLEAR RADIOACTIVE AREA
styles['FILL:G*F*AKBI--'] = styles['FILL:HATCH'] // KILL BOX / BLUE
styles['FILL:G*F*AKPI--'] = styles['FILL:HATCH'] // KILL BOX / PURPLE

styles.Polygon = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const featureStyles = makeStyles(feature, mode)
  const geometry = feature.getGeometry()

  const simplifiedGeometry = geometry.getCoordinates()[0].length > 50
    ? geometry.simplify(resolution)
    : geometry

  const smoothedGeometry = feature.get('style') && feature.get('style').smooth
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  const handles = featureStyles.handles(simplifiedGeometry)
  const labels = new PolygonLabels(smoothedGeometry, feature.getProperties())
  const texts = (styles[`TEXTS:${key}`] || []).flat()
    .map(text => ({ ...labels.label(text), ...text }))
    .filter(R.identity)
    .map(({ geometry, options }) => featureStyles.text(geometry, options))

  const fillPattern = styles[`FILL:${key}`]
  const guides = featureStyles.guideStroke(simplifiedGeometry)
  const style = styles[key]
    ? styles[key]({ feature, resolution, styles: featureStyles, geometry: smoothedGeometry })
    : featureStyles.defaultStroke(smoothedGeometry, { fillPattern })

  return [...style, ...texts, ...handles, ...guides]
}
