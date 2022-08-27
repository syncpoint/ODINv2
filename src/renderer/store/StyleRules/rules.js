// properties :: {k: v} - feature properties excluding geometry
// sidc :: String - feature SIDC (from properties)
// parameterizedSIDC :: String -
// identity :: Char - SIDC identity/affiliation code (F, H, etc.)
// centerResolution :: Number - resolution @ viewport center
// definingGeometry :: ol/geom/Geometry - original feature geometry
// geometryKey :: String - key of geometry_defining `ol_uid:revision`
// smoothen :: Boolean
// styleFactory :: { id, geometry, options } -> ol/style/Style
// labelSpecifications :: [{k: v}]
// styleSpecifications :: next -> { id, geometry }
// evalTextField :: (String || [String]) -> String
// simplified :: Boolean - whether or not geometry_defining was simplified
// simplifiedGeometry :: ol/geom/Geometry - original feature geometry, optionally simplified
// smoothenedGeometry :: ol/geom/Geometry - simplified geometry, optionally smoothened
// resolution :: Number - resolution @ first coordinate of geometry
// read :: ol/geom/Geometry -> jsts/geom/Geometry
// write :: jsts/geom/Geometry -> ol/geom/Geometry
// geometry :: jsts/geom/Geometry - JSTS/UTM transformed smoothened geometry



// text_anchors :: {k: fn} - functions to calculate label anchors

export const rules = []
