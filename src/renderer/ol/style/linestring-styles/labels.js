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
const CFL_1 = { id: 'style:default-text', 'text-field': '"CFL" + (modifiers.t ? " " + modifiers.t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_2 = { id: 'style:default-text', 'text-field': ['modifiers.w', 'modifiers.w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2]
const PL_1 = T => [W, E].map(props => ({ 'text-field': `${T} ? "PL " + ${T} : null`, ...props }))
const PL_2 = (T1, T2) => [NNW, NNE].map(props => ({ 'text-field': `(${T1} ? ${T1} : "") + ((${T1} || ${T2}) ? " " : "") +  (${T2} ? ${T2} : "")`, ...props }))
const PL_3 = [SSW, SSE].map(props => ({ 'text-field': ['modifiers.w', 'modifiers.w1'], ...props }))
const PL = (T1, T2) => T1 ? [PL_1('modifiers.t1'), PL_2(T1, T2), PL_3] : [PL_1('modifiers.t'), PL_3]
const MFP_1 = { id: 'style:default-text', 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1]
const BND_1 = { id: 'style:default-text', 'text-field': 'modifiers.t', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, ABOVE], 'text-rotation-anchor': 'fix' }
const BND_2 = { id: 'style:default-text', 'text-field': 'modifiers.t1', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, BELOW], 'text-rotation-anchor': 'fix' }
const BND_3 = { id: 'style:default-text', 'text-field': 'echelon', 'text-anchor': 'center', 'text-rotation-anchor': 'fix', 'text-padding': 5 }

const BND = [BND_1, BND_2, BND_3]

export const labels = {}
labels['G*T*A-----'] = [{ 'text-field': 'modifiers.t', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
labels['G*T*AS----'] = [{ 'text-field': 'modifiers.t', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
labels['G*G*GLB---'] = BND // BOUNDARIES
labels['G*G*GLP---'] = PL() // PHASE LINE
labels['G*G*GLL---'] = PL('"LL"', 'modifiers.t') // LIGHT LINE
labels['G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
labels['G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
labels['G*G*OLF---'] = PL('"FCL"', 'modifiers.t') // FINAL COORDINATION LINE
labels['G*G*OLL---'] = PL('"LOA"', 'modifiers.t') // LIMIT OF ADVANCE
labels['G*G*OLT---'] = PL('"LD"', 'modifiers.t') // LINE OF DEPARTURE
labels['G*G*OLC---'] = PL('"LD/LC"', 'modifiers.t') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
labels['G*G*OLP---'] = PL('"PLD"', 'modifiers.t') // PROBABLE LINE OF DEPLOYMENT (PLD)
labels['G*G*SLH---'] = NNEW('"HL"', { 'text-offset': [0, -10] }) // HOLDING LINE
labels['G*G*SLR---'] = PL('"RL"', 'modifiers.t') // RELEASE LINE
labels['G*G*SLB---'] = NNEW('"BL"', { 'text-offset': [0, -10] }) // BRIDGEHEAD
labels['G*F*LT----'] = MT('modifiers.t') // LINEAR TARGET
labels['G*F*LTS---'] = [MT('modifiers.t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
labels['G*F*LTF---'] = [MT('modifiers.t'), MB('"FPF" + (modifiers.t1 ? "\n" + modifiers.t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
labels['G*F*LCF---'] = PL('modifiers.t', '"FSCL"') // FIRE SUPPORT COORDINATION LINE (FSCL)
labels['G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
labels['G*F*LCN---'] = PL("'NFL'", 'modifiers.t') // NO-FIRE LINE (NFL)
labels['G*F*LCR---'] = PL('"RFL"', 'modifiers.t') // RESTRICTIVE FIRE LINE (RFL)
labels['G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
labels['G*S*LRM---'] = MT('"MSR" + (modifiers.t ? " " + modifiers.t : "")') // MAIN SUPPLY ROUTE
labels['G*S*LRA---'] = MT('"ASR" + (modifiers.t ? " " + modifiers.t : "")') // ALTERNATE SUPPLY ROUTE
labels['G*S*LRO---'] = MT(['"MSR" + (modifiers.t ? " " + modifiers.t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
labels['G*S*LRT---'] = MT(['"MSR" + (modifiers.t ? " " + modifiers.t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
labels['G*S*LRW---'] = MT(['"MSR" + (modifiers.t ? " " + modifiers.t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
labels['G*O*B-----'] = MM('"B"') // BEARING LINE
labels['G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
labels['G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
labels['G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
labels['G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT
