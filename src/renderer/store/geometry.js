export const type = descriptor => descriptor?.geometry?.type
  ? descriptor?.geometry?.type === 'GeometryCollection' || descriptor?.geometry?.type === 'MultiPoint'
    ? descriptor?.geometry?.layout
    : descriptor?.geometry?.type
  : 'n/a'
