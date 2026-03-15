# Military Symbology

ODIN supports the MIL-STD-2525C standard for military symbol identification codes (SIDC). Symbols can be placed on the map as point features within layers.

## Placing Symbols

1. Press ++ctrl+n++ to open the symbol search
2. Type a symbol name (e.g., "Infantry", "Headquarters", "Armor")
3. Select the desired symbol from the results
4. Click on the map to place the symbol

The symbol appears on the map with the standard military icon and any configured modifiers.

## Symbol Properties

Select a symbol to view and edit its properties in the Properties Panel:

| Property | Description |
|----------|-------------|
| **SIDC** | The 15-character Symbol Identification Code |
| **Designator (t)** | Unit designator text displayed below the symbol |
| **Additional Info (t1)** | Additional information text |
| **Name** | Display name shown in the sidebar |

## Affiliation

The second character of the SIDC determines the affiliation:

| Code | Affiliation | Colour |
|------|-------------|--------|
| F | Friendly | Blue |
| H | Hostile | Red |
| N | Neutral | Green |
| U | Unknown | Yellow |

## Common SIDC Examples

| SIDC | Description |
|------|-------------|
| `SFGPUCI----D---` | Friendly Infantry Unit |
| `SFGPUCIZ---D---` | Friendly Mechanised Infantry |
| `SFGPUCA----D---` | Friendly Armour Unit |
| `SFGPUH----H---` | Friendly Headquarters |
| `SHGPUCI----D---` | Hostile Infantry Unit |
| `GFGPGLB----K---` | Boundary Line |
| `GFGPGAA----K---` | Assembly Area |

## Colour Scheme

ODIN supports three colour schemes for military symbols:

- **Dark** — Standard dark colours
- **Medium** — Medium saturation
- **Light** — Light/pastel colours

The colour scheme can be configured globally, per layer, or per feature. Feature styles override layer styles, which override global styles.
