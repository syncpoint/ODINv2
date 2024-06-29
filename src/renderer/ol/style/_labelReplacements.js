import { echelonCode } from '../../symbology/2525c'
import { echelons } from './echelon'
import { evalSync } from './labels'

export default (sidc, modifiers) => {
  const sizeCode = echelonCode(sidc)
  const echelonText = (sizeCode === '*' || sizeCode === '-') ? '' : echelons[sizeCode]?.text
  return evalSync({ modifiers, echelon: echelonText })
}
