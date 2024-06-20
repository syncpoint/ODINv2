## Style Specification

color-scheme :: dark | medium | light

line-dash-array :: [number]
line-dash-offset :: number, default 0
line-halo-dash-array :: [number]
line-halo-dash-offset :: number, default 0
line-width :: number
line-color :: string
line-halo-width :: number
line-halo-color :: string
line-cap :: butt | round | square
line-join :: bevel | round | miter
line-miter-limit :: number, default 10
line-smooth :: boolean -> false | true
line-style :: auto | smooth

fill-color :: string
fill-pattern :: hatch | cross
fill-pattern-angle :: number, degrees
fill-pattern-size :: number
fill-pattern-spacing :: number

text-anchor :: 'center' | 'left' | 'right' |
	'top' | 'top-left' | 'top-right' |
	'bottom' | 'bottom-left' | 'bottom-right' |
	number, [0, 1]
text-clipping :: 'none' | 'line' | 'actual' (default)
text-color :: string (text/fill/color)
text-fill-color :: string (text/backgroundFill/color)
text-field :: string
text-font :: string
text-font-weight :: string
text-font-variant :: string
text-font-style :: string
text-font-family :: string
text-font-size :: number
text-halo-color :: string (text/stoke/color)
text-halo-width :: number (text/stoke/width)
text-justify :: 'start' | 'end' | 'center'
text-line-color :: string (text/backgroundStroke/color)
text-line-width :: number (text/backgroundStroke/width)
text-offset :: [X, Y] - pixel offset
text-padding :: number
text-rotate :: number
text-rotation-anchor :: auto | fix

// text-keep-upright

symbol-anchor :: string - unsupported
symbol-code :: string
symbol-color :: string (monoColor)
symbol-fill-opacity :: number (fillOpacity)
symbol-halo-color :: string (outlineColor)
symbol-halo-width :: string (outlineWidth)
symbol-line-width :: number (strokeWidth)
symbol-offset :: [number, number] - unsupported
symbol-rotate :: number
symbol-size :: number - default: 100 [pixels]
symbol-text :: boolean (infoFields)
symbol-text-font-family :: string
symbol-text-color :: string (infoColor)
symbol-text-size :: number - default: 40 [%]
symbol-text-halo-color :: string (infoOutlineColor)
symbol-text-halo-width :: string (infoOutlineWidth)

[internal]

circle-fill-color :: string
circle-line-color :: string
circle-line-width :: number
circle-radius :: number

icon-anchor :: number
icon-height :: number
icon-padding :: number
icon-rotate :: number
icon-scale :: number
icon-url :: string
icon-width :: number

shape-angle :: number
shape-fill-color :: string
shape-line-color :: string
shape-line-width :: number
shape-offset :: [number, number]
shape-points :: number
shape-radius :: number
shape-radius-2 :: number
shape-rotate :: number
shape-scale :: [number, number]
