/**
 * Line string position mnemonics:
 *
 *  LEFT | LEFT         CENTER       RIGHT | RIGHT  (ANCHOR)
 *   END | START        CENTER         END | START  (JUSTFY)
 *
 *
 *   WNW | NNW            N            NNE | ENE    (ABOVE)
 *     W |----------------|----------------| E
 *   WSW | SSW            S            SSE | ESE    (BELOW)
 *
 * EW    := E + W
 * NNEW  := NNE + NNW
 * SSEW  := SSE + SSW
 * EWNEW := ENE + WNW
 * EWSEW := ESE + WSW
 */

const ABOVE = -20
const BELOW = 20

const W = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-10, 0], 'text-padding': 5 }
const E = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [10, 0], 'text-padding': 5 }
const NNW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const NNE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const SSW = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, BELOW] }
const SSE = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, BELOW] }
const NNEW = (text, options) => [NNE, NNW].map(props => ({ 'text-field': text, ...props, ...options }))

const MT = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE], 'text-clipping': 'none' }]
const MB = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW], 'text-clipping': 'none' }]
const MM = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const SE = text => [W, E].map(props => ({ 'text-field': text, ...props }))
const CFL_1 = { id: 'style:default-text', 'text-field': '"CFL" + (t ? " " + t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_2 = { id: 'style:default-text', 'text-field': ['w', 'w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2]
const PL_1 = T => [W, E].map(props => ({ 'text-field': `${T} ? "PL " + ${T} : null`, ...props }))
const PL_2 = (T1, T2) => [NNW, NNE].map(props => ({ 'text-field': `(${T1} ? ${T1} : "") + ((${T1} || ${T2}) ? " " : "") +  (${T2} ? ${T2} : "")`, ...props }))
const PL_3 = [SSW, SSE].map(props => ({ 'text-field': ['w', 'w1'], ...props }))
const PL = (T1, T2) => T1 ? [PL_1('t1'), PL_2(T1, T2), PL_3] : [PL_1('t'), PL_3]
const MFP_1 = { id: 'style:default-text', 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1]
const BND_1 = { id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, ABOVE] }
const BND_2 = { id: 'style:default-text', 'text-field': 't1', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, BELOW] }
const BND_3 = { 'icon-image': 'echelon', 'icon-anchor': 0.5, 'icon-padding': 10 }
const BND = [BND_1, BND_2, BND_3]


const LABELS = {}
export default LABELS

LABELS['G*T*A-----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
LABELS['G*T*AS----'] = [{ 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
LABELS['G*G*GLB---'] = BND // BOUNDARIES
LABELS['G*G*GLP---'] = PL() // PHASE LINE
LABELS['G*G*GLL---'] = PL('"LL"', 't') // LIGHT LINE
LABELS['G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
LABELS['G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
LABELS['G*G*OLF---'] = PL('"FCL"', 't') // FINAL COORDINATION LINE
LABELS['G*G*OLL---'] = PL('"LOA"', 't') // LIMIT OF ADVANCE
LABELS['G*G*OLT---'] = PL('"LD"', 't') // LINE OF DEPARTURE
LABELS['G*G*OLC---'] = PL('"LD/LC"', 't') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
LABELS['G*G*OLP---'] = PL('"PLD"', 't') // PROBABLE LINE OF DEPLOYMENT (PLD)
LABELS['G*G*SLH---'] = NNEW('"HL"', { 'text-offset': [0, -10] }) // HOLDING LINE
LABELS['G*G*SLR---'] = PL('"RL"', 't') // RELEASE LINE
LABELS['G*G*SLB---'] = NNEW('"BL"', { 'text-offset': [0, -10] }) // BRIDGEHEAD
LABELS['G*F*LT----'] = MT('t') // LINEAR TARGET
LABELS['G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
LABELS['G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
LABELS['G*F*LCF---'] = PL('t', '"FSCL"') // FIRE SUPPORT COORDINATION LINE (FSCL)
LABELS['G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
LABELS['G*F*LCN---'] = PL("'NFL'", 't') // NO-FIRE LINE (NFL)
LABELS['G*F*LCR---'] = PL('"RFL"', 't') // RESTRICTIVE FIRE LINE (RFL)
LABELS['G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
LABELS['G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
LABELS['G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
LABELS['G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
LABELS['G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
LABELS['G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
LABELS['G*O*B-----'] = MM('"B"') // BEARING LINE
LABELS['G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
LABELS['G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
LABELS['G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
LABELS['G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT
