import { smooth } from './chaikin'

/**
 *
 */
export default (simplifiedGeometry, lineSmoothing) => lineSmoothing
  ? smooth(simplifiedGeometry)
  : simplifiedGeometry
