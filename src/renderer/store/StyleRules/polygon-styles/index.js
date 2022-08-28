/* eslint-disable no-multi-spaces */

import G_G_GAF from './G_G_GAF'
import G_G_PY from './G_G_PY'
import G_G_SAE from './G_G_SAE'
import G_M_OGB from './G_M_OGB'
import G_M_OGF from './G_M_OGF'
import G_M_OGR from './G_M_OGR'
import G_M_SP from './G_M_SP'

const DEFAULT = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }]
const FILL_HATCH = ({ geometry }) => [{ id: 'style:2525c/hatch-fill', geometry }]
const ERROR = ({ geometry }) => [{ id: 'style:wasp-stroke', geometry }]

export default {
  DEFAULT,
  FILL_HATCH,
  ERROR,
  'G*G*GAF---': G_G_GAF,    // FORTIFIED AREA
  'G*G*PY----': G_G_PY,     // DECOY MINED AREA, FENCED
  'G*G*SAE---': G_G_SAE,    // ENCIRCLEMENT
  'G*M*OGB---': G_M_OGB,    // OBSTACLES / GENERAL / BELT
  'G*M*OGF---': G_M_OGF,    // OBSTACLE FREE AREA
  'G*M*OGR---': G_M_OGR,    // OBSTACLE RESTRICTED AREA
  'G*M*OGZ---': G_M_OGB,    // OBSTACLES / GENERAL / ZONE
  'G*M*SP----': G_M_SP,     // STRONG POINT
  'G*F*ACNR--': FILL_HATCH, // NO-FIRE AREA (NFA)
  'G*F*AKBI--': FILL_HATCH, // KILL BOX / BLUE
  'G*F*AKPI--': FILL_HATCH, // KILL BOX / PURPLE
  'G*G*AAW---': FILL_HATCH, // LIMITED ACCESS AREA
  'G*G*GAY---': FILL_HATCH, // LIMITED ACCESS AREA
  'G*M*NB----': FILL_HATCH, // BIOLOGICALLY CONTAMINATED AREA
  'G*M*NC----': FILL_HATCH, // CHEMICALLY CONTAMINATED AREA
  'G*M*NR----': FILL_HATCH, // RADIOLOGICAL, AND NUCLEAR RADIOACTIVE AREA
  'G*F*AKBR--': FILL_HATCH, // KILL BOX/BLUE
  'G*F*AKPR--': FILL_HATCH  // KILL BOX/PURPLE
}
