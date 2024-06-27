import G_G_GAZ from '../resources/G_G_GAZ.png'

const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-clipping': 'none', ...options }]
const T = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'top', 'text-padding': 5, 'text-clipping': 'line' }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const F = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-offset': [0, 20] }]
const LR = text => ['left', 'right'].map(anchor => ({ id: 'style:default-text', 'text-field': text, 'text-anchor': anchor, 'text-padding': 5, 'text-clipping': 'line' }))
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(anchor => ({ id: 'style:default-text', 'text-field': text, 'text-anchor': anchor, 'text-padding': 5, 'text-clipping': 'line' }))
const DTG_LINE = '(modifiers.w || modifiers.w1) ? (modifiers.w ? modifiers.w : "") + "—" + (modifiers.w1 ? modifiers.w1 : "") : null'
const ALT_LINE = '(modifiers.x || modifiers.x1) ? (modifiers.x ? modifiers.x : "") + "—" + (modifiers.x1 ? modifiers.x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 'modifiers.t', 'modifiers.h', ALT_LINE, DTG_LINE]
  : ['modifiers.t', 'modifiers.h', ALT_LINE, DTG_LINE]

const G_G_PM = [
  ...TLBR('"M"'),
  { 'symbol-code': 'GFGPPD----', 'symbol-anchor': 'center', 'symbol-size': 100 }
]

export const labels = {}
labels['G*G*GAG---'] = C(ALL_LINES()) // GENERAL AREA
labels['G*G*GAA---'] = C(ALL_LINES('AA')) // ASSEMBLY AREA
labels['G*G*GAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA
labels['G*G*GAF---'] = C(ALL_LINES('')) // FORTIFIED AREA
labels['G*G*GAD---'] = C(ALL_LINES('DZ')) // DROP ZONE
labels['G*G*GAX---'] = C(ALL_LINES('EZ')) // EXTRACTION ZONE (EZ)
labels['G*G*GAL---'] = C(ALL_LINES('LZ')) // LANDING ZONE (LZ)
labels['G*G*GAP---'] = C(ALL_LINES('PZ')) // PICKUP ZONE (PZ)
labels['G*G*GAY---'] = C('h', { 'text-halo-color': 'white', 'text-halo-width': 5 }) // LIMITED ACCESS AREA
labels['G*G*GAZ---'] = [{ 'icon-url': G_G_GAZ, 'icon-anchor': 'center', 'icon-scale': 0.8 }] // AIRFIELD ZONE
labels['G*G*AAR---'] = C(ALL_LINES('ROZ')) // RESTRICTED OPERATIONS ZONE (ROZ)
labels['G*G*AAF---'] = C(ALL_LINES('SHORADEZ')) // SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
labels['G*G*AAH---'] = C(ALL_LINES('HIDACZ')) // HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
labels['G*G*AAM---'] = C(ALL_LINES('MEZ')) // MISSILE ENGAGEMENT ZONE (MEZ)
labels['G*G*AAML--'] = C(ALL_LINES('LOMEZ')) // LOW ALTITUDE MEZ
labels['G*G*AAMH--'] = C(ALL_LINES('HIMEZ')) // HIGH ALTITUDE MEZ
labels['G*G*AAW---'] = C(ALL_LINES('WFZ'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // WEAPONS FREE ZONE
labels['G*G*PM----'] = G_G_PM // DECOY MINED AREA
labels['G*G*PY----'] = G_G_PM // DECOY MINED AREA, FENCED
// G*G*PC---- : DUMMY MINEFIELD (DYNAMIC)
labels['G*G*DAB---'] = C(ALL_LINES()) // BATTLE POSITION
labels['G*G*DABP--'] = C('modifiers.t ? "(P) " + modifiers.t : (P)') // BATTLE POSITION / PREPARED BUT NOT OCCUPIED
labels['G*G*DAE---'] = C(ALL_LINES('EA')) // ENGAGEMENT AREA (DEFENSE)
labels['G*G*OAA---'] = C(ALL_LINES('ASLT\nPSN')) // ASSAULT POSITION
labels['G*G*OAK---'] = C(ALL_LINES('ATK')) // ATTACK POSITION
labels['G*G*OAO---'] = C(ALL_LINES('OBJ')) // OBJECTIVE (OFFENSE)
labels['G*G*OAP---'] = [] // PENETRATION BOX
labels['G*G*SAO---'] = C(ALL_LINES('AO')) // AREA OF OPERATIONS (AO)
labels['G*G*SAA---'] = F(['"AIRHEAD LINE"', 'modifiers.t ? "(PL " + modifiers.t + ")" : null']) // AIRHEAD
labels['G*G*SAE---'] = C(ALL_LINES()) // ENCIRCLEMENT
labels['G*G*SAN---'] = C(ALL_LINES('NAI')) // NAMED AREA OF INTEREST (NAI)
labels['G*G*SAT---'] = C(ALL_LINES('TAI')) // TARGETED AREA OF INTEREST (TAI)
labels['G*M*OGB---'] = C(['t', 't1']) // BELT (OBSTACLES)
labels['G*M*OGZ---'] = C(ALL_LINES()) // GENERAL ZONE (OBSTACLES)
labels['G*M*OGF---'] = C(ALL_LINES('FREE')) // OBSTACLE FREE AREA
labels['G*M*OGR---'] = C(ALL_LINES(), { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }) // OBSTACLE RESTRICTED AREA
// G*M*OFD--- : MINEFIELDS / DYNAMIC DEPICTION
labels['G*M*OFA---'] = TLBR('"M"') // MINED AREA
labels['G*M*OU----'] = LR('"UXO"') // UNEXPLODED ORDNANCE AREA (UXO)
labels['G*M*SP----'] = C('t') // STRONG POINT
labels['G*M*NL----'] = T('t') // DOSE RATE CONTOUR LINES
labels['G*F*ACSR--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
labels['G*F*ACAR--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
labels['G*F*ACFR--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
labels['G*F*ACNR--'] = C(ALL_LINES('NFA'), HALO) // NO-FIRE AREA (NFA)
labels['G*F*ACRR--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
labels['G*F*ACPR--'] = B('"PAA"') // POSITION AREA FOR ARTILLERY (PAA)
labels['G*F*ACER--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
labels['G*F*ACDR--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
labels['G*F*ACZR--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
labels['G*F*ACBR--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
labels['G*F*ACVR--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
labels['G*F*AT----'] = C(ALL_LINES()) // AREA TARGET
labels['G*F*ATG---'] = T('t') // SERIES OR GROUP OF TARGETS
labels['G*F*ATR---'] = C(ALL_LINES()) // RECTANGULAR TARGET
labels['G*F*ATS---'] = C(ALL_LINES('SMOKE')) // AREA TARGET / SMOKE
labels['G*F*ATB---'] = C(ALL_LINES('BOMB')) // BOMB AREA
labels['G*F*ACSI--'] = C(ALL_LINES('FSA')) // FIRE SUPPORT AREA (FSA)
labels['G*F*ACAI--'] = C(ALL_LINES('ACA')) // AIRSPACE COORDINATION AREA (ACA)
labels['G*F*ACFI--'] = C(ALL_LINES('FFA')) // FREE FIRE AREA (FFA)
labels['G*F*ACNI--'] = C(ALL_LINES('NFA'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // NO-FIRE AREA (NFA)
labels['G*F*ACRI--'] = C(ALL_LINES('RFA')) // RESTRICTIVE FIRE AREA (RFA)
labels['G*F*ACEI--'] = C(ALL_LINES('SENSOR ZONE')) // SENSOR ZONE
labels['G*F*ACDI--'] = C(ALL_LINES('DA')) // DEAD SPACE AREA (DA)
labels['G*F*ACZI--'] = C(ALL_LINES('ZOR')) // ZONE OF RESPONSIBILITY (ZOR)
labels['G*F*ACBI--'] = C(ALL_LINES('TBA')) // TARGET BUILD-UP AREA (TBA)
labels['G*F*ACVI--'] = C(ALL_LINES('TVAR')) // TARGET VALUE AREA (TVAR)
labels['G*F*ACT---'] = C(ALL_LINES('TGMF')) // TERMINALLY GUIDED MUNITION FOOTPRINT (TGMF)
labels['G*F*AKBR--'] = C(ALL_LINES('BKB'), HALO) // KILL BOX/BLUE
labels['G*F*AKPR--'] = C(ALL_LINES('PKB'), HALO) // KILL BOX/PURPLE
labels['G*F*AZII--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
labels['G*F*AZIR--'] = C(ALL_LINES('ATI ZONE')) // ARTILLERY TARGET INTELLIGENCE (ATI) ZONE
labels['G*F*AZXI--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
labels['G*F*AZXR--'] = C(ALL_LINES('CFF ZONE')) // CALL FOR FIRE ZONE (CFFZ)
labels['G*F*AZCI--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
labels['G*F*AZCR--'] = C(ALL_LINES('CENSOR ZONE')) // CENSOR ZONE
labels['G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
labels['G*F*AZFR--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
labels['G*F*AKBI--'] = C(ALL_LINES('BKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / BLUE
labels['G*F*AKPI--'] = C(ALL_LINES('PKB'), { 'text-halo-color': 'white', 'text-halo-width': 5 }) // KILL BOX / PURPLE
labels['G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
labels['G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
labels['G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
labels['G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
labels['G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
labels['G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
labels['G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
labels['G*M*NR----'] = [{ 'symbol-code': 'GFMPNZ----', 'symbol-anchor': 'center' }] // RADIOACTIVE AREA
labels['G*M*NB----'] = [{ 'symbol-code': 'GFMPNEB---', 'symbol-anchor': 'center' }] // BIOLOGICALLY CONTAMINATED AREA
labels['G*M*NC----'] = [{ 'symbol-code': 'GFMPNEC---', 'symbol-anchor': 'center' }] // CHEMICALLY CONTAMINATED AREA
