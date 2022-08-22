// properties :: {k: v} - feature properties excluding geometry
// sidc :: String - feature SIDC (from properties)
// identity :: Char - SIDC identity/affiliation code (F, H, etc.)
// resolution_center :: Number - resolution @ viewport center
// resolution_point :: Number -> Number - calculate exact resolution at given point
// resolution :: Number - resolution @ first coordinate of geometry_smoothened
// geometry_defining :: ol/geom/Geometry - original feature geometry
// geometry_key :: String - key of geometry_defining `ol_uid:revision`
// geometry_simplified :: ol/geom/Geometry - original feature geometry, optionally simplified
// simplified :: Boolean - whether or not geometry_defining was simplified
// geometry_smoothened :: ol/geom/Geometry - simplified geometry, optionally smoothened
// read :: ol/geom/Geometry -> jsts/geom/Geometry
// write :: jsts/geom/Geometry -> ol/geom/Geometry
// geometry_utm :: jsts/geom/Geometry - JSTS/UTM transformed smoothened geometry

export const rules = []
