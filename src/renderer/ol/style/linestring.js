import { styles } from './styles'

styles.LineString = args => {
  // TODO: simplify geometry depending on point count and resolution
  const { feature } = args
  const geometry = feature.getGeometry()
  if (!geometry.getCoordinates().length) return null

  const sidc = feature.get('sidc')

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](sidc),
    texts: []
  })
}

styles['LineString:G*G*GLL---'] = args => {
  console.log('[LineString:G*G*GLL---]')
  return styles.LineString(args)
}
