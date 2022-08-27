import G_G_GAF from './G_G_GAF'
import G_G_PY from './G_G_PY'
import G_G_SAE from './G_G_SAE'
import G_M_OGB from './G_M_OGB'
import G_M_OGF from './G_M_OGF'
import G_M_OGR from './G_M_OGR'
import G_M_SP from './G_M_SP'

export default {
  DEFAULT: ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }],
  'G*G*GAF---': G_G_GAF, // FORTIFIED AREA
  'G*G*PY----': G_G_PY, // DECOY MINED AREA, FENCED
  'G*G*SAE---': G_G_SAE, // ENCIRCLEMENT
  'G*M*OGB---': G_M_OGB, // OBSTACLES / GENERAL / BELT
  'G*M*OGF---': G_M_OGF, // OBSTACLE FREE AREA
  'G*M*OGR---': G_M_OGR, // OBSTACLE RESTRICTED AREA
  'G*M*OGZ---': G_M_OGB, // OBSTACLES / GENERAL / ZONE
  'G*M*SP----': G_M_SP // STRONG POINT
}
