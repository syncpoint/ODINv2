
/**
 *
 */
export default fn => ({ geometry, ...rest }) =>
  geometry
    ? ({ geometry: fn(geometry), ...rest })
    : rest