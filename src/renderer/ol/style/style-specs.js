import * as MILSTD from '../../2525c'
import * as Colors from './color-schemes'

const C = text => [{ text, position: 'center' }]
const T = text => [{ text, position: 'top' }]
const B = text => [{ text, position: 'bottom' }]
const F = text => [{ text, position: 'footer' }]
const LR = text => ['left', 'right'].map(position => ({ text, position }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(position => ({ text, position }))
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]


// 8cbb6c2e-7637-4603-9d2c-dd59b8252ea4 - preferences/project: color scheme (dark, medium, light)
const scheme = 'medium'

const specs = {}
export default specs

specs['STROKES:DEFAULT'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const lineDash = MILSTD.status(sidc) === 'A' ? [20, 10] : null
  return [
    { color: Colors.stroke(standardIdentity), width: 3, lineDash },
    { color: Colors.fill(scheme)(standardIdentity), width: 2, lineDash }
  ]
}

specs['STROKES:SOLID'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  return [
    { color: Colors.stroke(standardIdentity), width: 3 },
    { color: Colors.fill(scheme)(standardIdentity), width: 2 }
  ]
}

specs['TEXTS:DEFAULT'] = C(ALL_LINES())

specs['TEXTS:G*G*GAG---'] = specs['TEXTS:DEFAULT'] // GENERAL AREA
specs['TEXTS:G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
specs['TEXTS:G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
// TODO: G*G*GAF--- : FORTIFIED AREA
specs['TEXTS:G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
specs['TEXTS:G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
specs['TEXTS:G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
specs['TEXTS:G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
specs['TEXTS:G*G*GAY---'] = C('h') // LIMITED ACCESS AREA
// TODO: G*G*GAZ--- : AIRFIELD ZONE
specs['TEXTS:G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
specs['TEXTS:G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
specs['TEXTS:G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
specs['TEXTS:G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
specs['TEXTS:G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
specs['TEXTS:G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
specs['TEXTS:G*G*AAW---'] = C(ALL_LINES('WFZ')) // WEAPONS FREE ZONE
specs['TEXTS:G*G*PM----'] = TLBR('"M"') // DECOY MINED AREA
// TODO: G*G*PY---- : DECOY MINED AREA, FENCED
// TODO: G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
specs['TEXTS:G*G*DAB---'] = specs['TEXTS:DEFAULT'] // BATTLE POSITION
specs['TEXTS:G*G*DABP--'] = C('t ? "(P) " + t : (P)') // BATTLE POSITION / PREPARED BUT NOT OCCUPIED
specs['TEXTS:G*G*DAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA (DEFENSE)
specs['TEXTS:G*G*OAA---'] = C(ALL_LINES('ASLT\nPSN')) // ASSAULT POSITION
specs['TEXTS:G*G*OAK---'] = C(ALL_LINES('ATK')) // ATTACK POSITION
specs['TEXTS:G*G*OAO---'] = C(ALL_LINES('OBJ')) // OBJECTIVE (OFFENSE)
specs['TEXTS:G*G*OAP---'] = [] // PENETRATION BOX
specs['TEXTS:G*G*SAO---'] = C(ALL_LINES('AO')) // AREA OF OPERATIONS (AO)
specs['TEXTS:G*G*SAA---'] = F(['"AIRHEAD LINE"', 't ? "(PL " + t + ")" : null']) // AIRHEAD
// TODO: G*G*SAE--- : ENCIRCLEMENT
specs['TEXTS:G*G*SAN---'] = C(ALL_LINES('NAI')) // NAMED AREA OF INTEREST (NAI)
specs['TEXTS:G*G*SAT---'] = C(ALL_LINES('TAI')) // TARGETED AREA OF INTEREST (TAI)
specs['TEXTS:G*M*OGB---'] = C(['t', 't1']) // BELT (OBSTACLES)
specs['TEXTS:G*M*OGZ---'] = specs['TEXTS:DEFAULT'] // GENERAL ZONE (OBSTACLES)
specs['TEXTS:G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
specs['TEXTS:G*M*OGR---'] = specs['TEXTS:DEFAULT'] // OBSTACLE RESTRICTED AREA
// TODO: G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
specs['TEXTS:G*M*OFA---'] = TLBR('"M"') // MINED AREA
specs['TEXTS:G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
specs['TEXTS:G*M*SP----'] = C('t') // STRONG POINT
specs['TEXTS:G*F*AT----'] = specs['TEXTS:DEFAULT'] // AREA TARGET
// TODO: G*F*ATR--- : RECTANGULAR TARGET
specs['TEXTS:G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
specs['TEXTS:G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
specs['TEXTS:G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
specs['TEXTS:G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
specs['TEXTS:G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
specs['TEXTS:G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
specs['TEXTS:G*F*ACNI--'] = C(ALL_LINES('NFA')) // NO-FIRE AREA (NFA)
specs['TEXTS:G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
specs['TEXTS:G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
specs['TEXTS:G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
specs['TEXTS:G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
specs['TEXTS:G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
specs['TEXTS:G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
specs['TEXTS:G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
specs['TEXTS:G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
specs['TEXTS:G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
specs['TEXTS:G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
specs['TEXTS:G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
specs['TEXTS:G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
specs['TEXTS:G*F*AKBI--'] = C(ALL_LINES('BKB')) // KILL BOX / BLUE
specs['TEXTS:G*F*AKPI--'] = C(ALL_LINES('PKB')) // KILL BOX / PURPLE
specs['TEXTS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
specs['TEXTS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
specs['TEXTS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
specs['TEXTS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
specs['TEXTS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
specs['TEXTS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
specs['TEXTS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
