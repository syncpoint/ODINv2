```
makeStyle ::
	k = geometry | fill | image | stroke | text,
  geometry = ol/Feature | ol/geom/Geometry | ol/Feature -> ol/geom/Geometry =>
	{k: v} -> ol/style/Style

makeFill ::
	k = color =>
	{k: v} -> ol/style/Fill

makeImage ::
	k = opacity | rotation | scale =>
  {k: v} -> ol/style/Image

makeStroke ::
	k = color | line{Cap | Join | Dash | DashOffset} | width =>
  {k: v} -> ol/style/Stroke

makeText ::
	k = font | offset{X | Y} | overflow | scale | rotation | fill | stroke | text |
	    background{Fill | Stroke} | padding =>
  {k: v} -> ol/style/text

```

## Style Specification

circle-fill-color :: string
circle-line-color :: string
circle-line-width :: number
circle-radius :: number,

fill-color :: string
fill-pattern :: hatch | cross
fill-pattern-angle :: number, degrees
fill-pattern-size :: number
fill-pattern-spacing :: number

icon-anchor :: number
icon-height :: number
icon-padding :: number
icon-rotate :: number
icon-scale :: number
icon-url :: stirng
icon-width :: number

line-cap :: butt | round | square
line-color :: string
line-dash-array :: [number]
line-dash-offset :: number, default 0
line-halo-color :: string
line-halo-dash-array :: [number]
line-halo-width :: number
line-join :: bevel | round | miter
line-miter-limit :: number, default 10
line-width :: number

text-anchor :: 'center' | 'left' | 'right' |
	'top' | 'top-left' | 'top-right' |
	'bottom' | 'bottom-left' | 'bottom-right' |
	number, [0, 1]
text-clipping :: 'none' | 'line' | 'actual' (default)
text-color :: string
text-fill-color :: string
text-field :: string
text-font :: string
text-font-familiy :: string
text-font-size :: number
text-font-weight :: string
text-halo-color :: string
text-halo-width :: number
text-justify :: 'start' | 'end' | 'center'
text-line-color :: string
text-line-width :: number
text-offset :: [X, Y] - pixel offset
text-padding :: number
text-rotate :: number

shape-angle :: number
shape-fill-color :: string
shape-line-color :: string
shape-line-width :: number
shape-offset :: [number, number]
shape-points :: number
shape-radius :: number
shape-radius-1 :: number
shape-radius-2 :: number
shape-rotate :: number
shape-scale :: [number, number]

symbol-anchor :: string - unsupported
symbol-code :: string
symbol-color :: string
symbol-color-scheme :: 'dark' | 'medium' | 'light'
symbol-fill-opacity :: numberq
symbol-halo-color :: string
symbol-halo-width :: string
symbol-line-width :: number
symbol-modifiers :: {k: v}
symbol-offset :: [number, number] - unsupported
symbol-rotate :: number
symbol-size :: number
symbol-text-color :: string
symbol-text-size :: number
