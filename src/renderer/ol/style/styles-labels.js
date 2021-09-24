import { styles } from './styles'

// Text with (white) outline.
const textStrokeWidth = 3

// TODO: rename verticalAlign -> offsetY
// TODO: rename textAlign -> align


/*
    STATIC LABEL
    text :: Expression
    textAlign :: 'start' | 'end' | 'left' | 'right' | 'center' | (0 <= fraction <= 1)
    verticalAlign (LineString only) :: 'TOP' (-25) | 'BOTTOM' (+25) | number - offsetY
    position (Polygon only) :: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'topRight' | 'topLeft'
*/

// ==> LineString labels.

const MT = text => [{ text, textAlign: 0.5, verticalAlign: 'top' }]
const MB = text => [{ text, textAlign: 0.5, verticalAlign: 'bottom' }]
const MM = text => [{ text, textAlign: 0.5, textStrokeWidth }]
const SE = text => ['start', 'end'].map(textAlign => ({ text, textAlign }))
const PL = title => ['start', 'end'].map(textAlign => ({ text: [`"${title}"`, 't ? "(PL " + t + ")" : null'], textAlign }))

const FSCL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  ['left', 'right'].map(textAlign => ({ text: '(t ? t + " " : "") + "FSCL"', textAlign, verticalAlign: 'top' })),
  ['left', 'right'].map(textAlign => ({ text: ['w', 'w1'], textAlign, verticalAlign: 'bottom' }))
]

const CFL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  { text: '"CFL" + (t ? " " + t : "")', textAlign: 0.5, verticalAlign: 'top' },
  { text: ['w', 'w1'], textAlign: 0.5, verticalAlign: 'bottom' }
]

const RFL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  ['left', 'right'].map(textAlign => ({ text: '"RFL" + (t ? " " + t  : "")', textAlign, verticalAlign: 'top' })),
  ['left', 'right'].map(textAlign => ({ text: ['w', 'w1'], textAlign, verticalAlign: 'bottom' }))
]

const MFP = [
  { text: '"MFP"', textAlign: 0.5, textStrokeWidth },
  { text: ['w', 'w1'], textAlign: 'left', verticalAlign: 'bottom' }
]

styles['LABELS:LINE_STRING'] = []
styles['LABELS:G*T*A-----'] = [{ text: 't', textAlign: 0.15 }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ text: 't', textAlign: 0.15 }] // FOLLOW AND SUPPORT
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
styles['LABELS:G*F*AZFI--'] = C(ALL_LINES('CF ZONE')) // CRITICAL FRIENDLY ZONE (CFZ)
styles['LABELS:G*F*AKBI--'] = C(ALL_LINES('BKB'), textStrokeWidth) // KILL BOX / BLUE
styles['LABELS:G*F*AKPI--'] = C(ALL_LINES('PKB'), textStrokeWidth) // KILL BOX / PURPLE
styles['LABELS:G*S*AD----'] = C(ALL_LINES('DETAINEE\nHOLDING\nAREA')) // DETAINEE HOLDING AREA
styles['LABELS:G*S*AE----'] = C(ALL_LINES('EPW\nHOLDING\nAREA')) // ENEMY PRISONER OF WAR (EPW) HOLDING AREA
styles['LABELS:G*S*AR----'] = C(ALL_LINES('FARP')) // FORWARD ARMING AND REFUELING AREA (FARP)
styles['LABELS:G*S*AH----'] = C(ALL_LINES('REFUGEE\nHOLDING\nAREA')) // REFUGEE HOLDING AREA
styles['LABELS:G*S*ASB---'] = C(ALL_LINES('BSA')) // SUPPORT AREAS / BRIGADE (BSA)
styles['LABELS:G*S*ASD---'] = C(ALL_LINES('DSA')) // SUPPORT AREAS / DIVISON (DSA)
styles['LABELS:G*S*ASR---'] = C(ALL_LINES('RSA')) // SUPPORT AREAS / REGIMENTAL (DSA)
styles['LABELS:G*M*NR----'] = [{ symbol: 'GFMPNZ----', position: 'center' }] // RADIOACTIVE AREA
styles['LABELS:G*M*NB----'] = [{ symbol: 'GFMPNEB---', position: 'center' }] // BIOLOGICALLY CONTAMINATED AREA
styles['LABELS:G*M*NC----'] = [{ symbol: 'GFMPNEC---', position: 'center' }] // CHEMICALLY CONTAMINATED AREA

// <== Polygon labels.
