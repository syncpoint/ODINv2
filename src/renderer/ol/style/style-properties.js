import * as MILSTD from '../../2525c'
import * as Colors from './color-schemes'


// MANIFEST

// G*F*ACAI-- : TACGRP.FSUPP.ARS.C2ARS.ACA.IRR - AIRSPACE COORDINATION AREA (ACA) / IRREGULAR
// G*F*ACBI-- : TACGRP.FSUPP.ARS.C2ARS.TBA.IRR - TARGET BUILD-UP AREA (TBA) / IRREGULAR
// G*G*AAF--- : TACGRP.C2GM.AVN.ARS.SHRDEZ - SHORT-RANGE AIR DEFENSE ENGAGEMENT ZONE (SHORADEZ)
// G*G*AAH--- : TACGRP.C2GM.AVN.ARS.HIDACZ - HIGH DENSITY AIRSPACE CONTROL ZONE (HIDACZ)
// G*G*AAM--- : TACGRP.C2GM.AVN.ARS.MEZ - MISSILE ENGAGEMENT ZONE (MEZ)
// G*G*AAMH-- : TACGRP.C2GM.AVN.ARS.MEZ.HAMEZ - MISSILE ENGAGEMENT ZONE (MEZ) HIGH ALTITUDE MEZ
// G*G*AAML-- : TACGRP.C2GM.AVN.ARS.MEZ.LAMEZ - MISSILE ENGAGEMENT ZONE (MEZ) LOW ALTITUDE MEZ
// G*G*AAR--- : TACGRP.C2GM.AVN.ARS.ROZ - RESTRICTED OPERATIONS ZONE (ROZ)
// G*G*OAO--- : TACGRP.C2GM.OFF.ARS.OBJ - AREAS / OBJECTIVE
// G*G*PM---- : TACGRP.C2GM.DCPN.DMA - DECOY MINED AREA
// G*G*SAT--- : TACGRP.C2GM.SPL.ARA.TAI - TARGETED AREA OF INTEREST (TAI)
// G*M*OFA--- : TACGRP.MOBSU.OBST.MNEFLD.MNDARA - MINED AREA
// G*M*SP---- : TACGRP.MOBSU.SU.STRGPT - STRONG POINT

const C = text => [{ text, position: 'center' }]
const TLBR = text => ['top', 'left', 'bottom', 'right'].map(position => ({ text, position }))
const TL = text => [{ text, position: 'topLeft', align: 'right', offsetX: -20 }]
const OPT = (label, property) => `${property} ? "${label}: " + ${property} : null`

const specs = {}
export default specs

specs['TEMPLATE:TACGRP.C2GM.AVN.ARS'] = title => C([
  `"${title}"`,
  't',
  OPT('MIN ALT', 'x'),
  OPT('MAX ALT', 'x1'),
  OPT('TIME FROM', 'w'),
  OPT('TIME TO', 'w1')
])

specs['STROKES:DEFAULT'] = sidc => {
  const scheme = 'medium' // TODO: settings/color-scheme
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const lineDash = MILSTD.status(sidc) === 'A' ? [20, 10] : null

  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  return [
    { color: Colors.stroke(standardIdentity), width: 3, lineDash },
    { color: Colors.fill(scheme)(standardIdentity), width: 2, lineDash }
  ]
}

specs['STROKES:SOLID'] = sidc => {
  const scheme = 'medium' // TODO: settings/color-scheme
  const standardIdentity = MILSTD.standardIdentity(sidc)

  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  return [
    { color: Colors.stroke(standardIdentity), width: 3 },
    { color: Colors.fill(scheme)(standardIdentity), width: 2 }
  ]
}

specs['TEXTS:DEFAULT'] = [
  { text: 'sidc', position: 'center' }
]

specs['TEXTS:G*F*ACAI--'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('ACA')
specs['TEXTS:G*F*ACBI--'] = [C('t ? "TBA\n" + t : "TBA"'), TL(['w', 'w1'])]
specs['TEXTS:G*G*AAF---'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('SHORADEZ')
specs['TEXTS:G*G*AAH---'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('HIDACZ')
specs['TEXTS:G*G*AAM---'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('MEZ')
specs['TEXTS:G*G*AAMH--'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('HIMEZ')
specs['TEXTS:G*G*AAML--'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('LOMEZ')
specs['TEXTS:G*G*AAR---'] = specs['TEMPLATE:TACGRP.C2GM.AVN.ARS']('ROZ')
specs['TEXTS:G*G*OAO---'] = C('t ? "OBJ\n" + t : "OBJ"')
specs['TEXTS:G*G*PM----'] = TLBR('"M"') // TODO: decoy signifier
specs['TEXTS:G*G*SAT---'] = C('t ? "TAI\n" + t : "TAI"')
specs['TEXTS:G*M*OFA---'] = TLBR('"M"')
specs['TEXTS:G*M*SP----'] = C('t')
