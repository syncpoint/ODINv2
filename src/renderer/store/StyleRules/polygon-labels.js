import G_G_GAZ from '../../ol/style/resources/G_G_GAZ.png'

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

export const LABELS = {}
export default LABELS

LABELS['G*G*GAG---'] = C(ALL_LINES()) // GENERAL AREA
LABELS['G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
LABELS['G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
LABELS['G*G*GAF---'] = C(ALL_LINES('')) // FORTIFIED AREA
LABELS['G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
LABELS['G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
LABELS['G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
LABELS['G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
LABELS['G*G*GAY---'] = C('h', { 'text-halo-color': 'white', 'text-halo-width': 5 }) // LIMITED ACCESS AREA
LABELS['G*G*GAZ---'] = [{ 'icon-url': G_G_GAZ, 'icon-anchor': 'center', 'icon-scale': 0.8 }] // AIRFIELD ZONE
LABELS['G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
LABELS['G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
LABELS['G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
LABELS['G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
LABELS['G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
LABELS['G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
LABELS['G*G*AAW---'] = C(ALL_LINES('WFZ'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // WEAPONS FREE ZONE
LABELS['G*G*PM----'] = G_G_PM // DECOY MINED AREA
LABELS['G*G*PY----'] = G_G_PM // DECOY MINED AREA, FENCED
// TODO: G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
LABELS['G*G*DAB---'] = C(ALL_LINES()) // BATTLE POSITION
LABELS['G*G*DABP--'] = C('t ? "(P) " + t : (P)') // BATTLE POSITION / PREPARED BUT NOT OCCUPIED
LABELS['G*G*DAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA (DEFENSE)
LABELS['G*G*OAA---'] = C(ALL_LINES('ASLT\nPSN')) // ASSAULT POSITION
LABELS['G*G*OAK---'] = C(ALL_LINES('ATK')) // ATTACK POSITION
LABELS['G*G*OAO---'] = C(ALL_LINES('OBJ')) // OBJECTIVE (OFFENSE)
LABELS['G*G*OAP---'] = [] // PENETRATION BOX
LABELS['G*G*SAO---'] = C(ALL_LINES('AO')) // AREA OF OPERATIONS (AO)
LABELS['G*G*SAA---'] = F(['"AIRHEAD LINE"', 't ? "(PL " + t + ")" : null']) // AIRHEAD
LABELS['G*G*SAE---'] = C(ALL_LINES()) // ENCIRCLEMENT
LABELS['G*G*SAN---'] = C(ALL_LINES('NAI')) // NAMED AREA OF INTEREST (NAI)
LABELS['G*G*SAT---'] = C(ALL_LINES('TAI')) // TARGETED AREA OF INTEREST (TAI)
LABELS['G*M*OGB---'] = C(['t', 't1']) // BELT (OBSTACLES)
LABELS['G*M*OGZ---'] = C(ALL_LINES()) // GENERAL ZONE (OBSTACLES)
LABELS['G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
LABELS['G*M*OGR---'] = C(ALL_LINES(), { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }) // OBSTACLE RESTRICTED AREA
// TODO: G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
LABELS['G*M*OFA---'] = TLBR('"M"') // MINED AREA
LABELS['G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
LABELS['G*M*SP----'] = C('t') // STRONG POINT
LABELS['G*M*NL----'] = T('t') // DOSE RATE CONTOUR LINES
LABELS['G*F*ACSR--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
LABELS['G*F*ACAR--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
LABELS['G*F*ACFR--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
LABELS['G*F*ACNR--'] = C(ALL_LINES('NFA'), HALO) // NO-FIRE AREA (NFA)
LABELS['G*F*ACRR--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
LABELS['G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
LABELS['G*F*ACER--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
LABELS['G*F*ACDR--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
LABELS['G*F*ACZR--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
LABELS['G*F*ACBR--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
LABELS['G*F*ACVR--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
LABELS['G*F*AT----'] = C(ALL_LINES()) // AREA TARGET
LABELS['G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
LABELS['G*F*ATR---'] = C(ALL_LINES()) // RECTANGULAR TARGET
LABELS['G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
LABELS['G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
LABELS['G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
LABELS['G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
LABELS['G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
LABELS['G*F*ACNI--'] = C(ALL_LINES('NFA')) // NO-FIRE AREA (NFA)
LABELS['G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
LABELS['G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
LABELS['G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
LABELS['G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
LABELS['G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
LABELS['G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
LABELS['G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
LABELS['G*F*AKBR--'] = C(ALL_LINES('BKB'), HALO) // KILL BOX/BLUE
LABELS['G*F*AKPR--'] = C(ALL_LINES('PKB'), HALO) // KILL BOX/PURPLE
LABELS['G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
LABELS['G*F*AZIR--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
LABELS['G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
LABELS['G*F*AZXR--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
LABELS['G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
LABELS['G*F*AZCR--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
LABELS['G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
LABELS['G*F*AZFR--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
LABELS['G*F*AKBI--'] = C(ALL_LINES('BKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / BLUE
LABELS['G*F*AKPI--'] = C(ALL_LINES('PKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / PURPLE
LABELS['G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
LABELS['G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
LABELS['G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
LABELS['G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
LABELS['G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
LABELS['G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
LABELS['G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
LABELS['G*M*NR----'] = [{ 'symbol-code': 'GFMPNZ----', 'symbol-anchor': 'center' }] // RADIOACTIVE AREA
LABELS['G*M*NB----'] = [{ 'symbol-code': 'GFMPNEB---', 'symbol-anchor': 'center' }] // BIOLOGICALLY CONTAMINATED AREA
LABELS['G*M*NC----'] = [{ 'symbol-code': 'GFMPNEC---', 'symbol-anchor': 'center' }] // CHEMICALLY CONTAMINATED AREA
