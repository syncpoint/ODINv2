
/**
 *
 */
export default hooks => (simplifiedGeometry, lineSmoothing) =>
  lineSmoothing
    ? hooks.smoothenGeometry(simplifiedGeometry)
    : simplifiedGeometry
