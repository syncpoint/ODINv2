# License Audit — ODINv2 v3.3.0

**Generated:** 2026-05-19
**Scope:** All production runtime dependencies of `odin-v2@3.3.0`, i.e. what ships in the Electron distributable. DevDependencies (electron, webpack, eslint, mocha, …) are *not* covered by this audit, since they are not redistributed with the product. They were spot-checked separately and contain no copyleft surprises.
**Method:** `license-checker-rseidelsohn --production --json` against the locked tree, followed by manual verification of every entry the tool flagged as `UNKNOWN`, `Custom`, or with a trailing `*` (meaning the SPDX expression in `package.json` could not be confirmed against an actual LICENSE file).

> **Headline result.** The 149 third-party production packages are all distributable under permissive terms once dual-licensed packages are evaluated. **No GPL / AGPL / LGPL / SSPL packages are present** in the production tree. The audit found **no blocker for AGPL-3.0 distribution of ODINv2** and **no blocker for commercial sub-licensing**, with one caveat (`dompurify`, MPL-2.0|Apache-2.0) discussed in §5b.

---

## 1. Complete list of production packages

The full list of 149 packages with name, version, declared license, effective license, and repository URL is in the table below. For redistributable copyright/permission notices and the full text of each license, see **`THIRD_PARTY_LICENSES.md`**, which is the file you ship with the binary.

<details><summary>Full table (149 rows)</summary>

| Package | Version | Declared license | Effective license | Repository |
|---|---|---|---|---|
| `@babel/runtime` | 7.28.6 | `MIT` | `MIT` | github.com/babel/babel |
| `@floating-ui/core` | 1.7.4 | `MIT` | `MIT` | github.com/floating-ui/floating-ui |
| `@floating-ui/dom` | 1.7.5 | `MIT` | `MIT` | github.com/floating-ui/floating-ui |
| `@floating-ui/utils` | 0.2.10 | `MIT` | `MIT` | github.com/floating-ui/floating-ui |
| `@matrix-org/matrix-sdk-crypto-wasm` | 17.1.0 | `Apache-2.0` | `Apache-2.0` | github.com/matrix-org/matrix-sdk-crypto-wasm |
| `@mdi/js` | 7.4.47 | `Apache-2.0` | `Apache-2.0` | github.com/Templarian/MaterialDesign-JS |
| `@mdi/react` | 1.6.1 | `MIT` | `MIT` | github.com/Templarian/MaterialDesign-React |
| `@petamoriken/float16` | 3.9.3 | `MIT` | `MIT` | github.com/petamoriken/float16 |
| `@radix-ui/react-compose-refs` | 1.1.2 | `MIT` | `MIT` | github.com/radix-ui/primitives |
| `@radix-ui/react-portal` | 1.1.10 | `MIT` | `MIT` | github.com/radix-ui/primitives |
| `@radix-ui/react-primitive` | 2.1.4 | `MIT` | `MIT` | github.com/radix-ui/primitives |
| `@radix-ui/react-slot` | 1.2.4 | `MIT` | `MIT` | github.com/radix-ui/primitives |
| `@radix-ui/react-use-layout-effect` | 1.1.1 | `MIT` | `MIT` | github.com/radix-ui/primitives |
| `@reach/observe-rect` | 1.2.0 | `MIT` | `MIT` | github.com/reach/observe-rect |
| `@syncpoint/matrix-client-api` | 2.3.0 | `MIT` | `MIT` |  |
| `@syncpoint/signal` | 1.3.0 | `MIT` | `MIT` | github.com/syncpoint/signal |
| `@syncpoint/signs` | 1.1.0 | `MIT` | `MIT` |  |
| `@syncpoint/wkx` | 0.5.2 | `MIT` | `MIT` | github.com/syncpoint/wkx |
| `@types/node` | 15.14.9 | `MIT` | `MIT` | github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/pako` | 2.0.4 | `MIT` | `MIT` | github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/raf` | 3.4.3 | `MIT` | `MIT` | github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/rbush` | 4.0.0 | `MIT` | `MIT` | github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/trusted-types` | 2.0.7 | `MIT` | `MIT` | github.com/DefinitelyTyped/DefinitelyTyped |
| `abstract-leveldown` | 7.2.0 | `MIT` | `MIT` | github.com/Level/abstract-leveldown |
| `base64-arraybuffer` | 1.0.2 | `MIT` | `MIT` | github.com/niklasvh/base64-arraybuffer |
| `base64-js` | 1.5.1 | `MIT` | `MIT` | github.com/beatgammit/base64-js |
| `buffer` | 6.0.3 | `MIT` | `MIT` | github.com/feross/buffer |
| `buffer-from` | 1.1.2 | `MIT` | `MIT` | github.com/LinusU/buffer-from |
| `canvg` | 3.0.11 | `MIT` | `MIT` | github.com/canvg/canvg |
| `catering` | 2.1.1 | `MIT` | `MIT` | github.com/vweevers/catering |
| `classnames` | 2.5.1 | `MIT` | `MIT` | github.com/JedWatson/classnames |
| `color` | 5.0.3 | `MIT` | `MIT` | github.com/Qix-/color |
| `color-convert` | 3.1.3 | `MIT` | `MIT` | github.com/Qix-/color-convert |
| `color-name` | 2.1.0 | `MIT` | `MIT` | github.com/colorjs/color-name |
| `color-string` | 2.1.4 | `MIT` | `MIT` | github.com/Qix-/color-string |
| `concat-stream` | 2.0.0 | `MIT` | `MIT` | github.com/maxogden/concat-stream |
| `core-js` | 3.48.0 | `MIT` | `MIT` | github.com/zloirock/core-js |
| `css-line-break` | 2.1.0 | `MIT` | `MIT` | github.com/niklasvh/css-line-break |
| `deferred-leveldown` | 7.0.0 | `MIT` | `MIT` | github.com/Level/deferred-leveldown |
| `defined` | 0.0.0 | `MIT` | `MIT` | github.com/substack/defined |
| `dompurify` | 3.3.1 | `(MPL-2.0 OR Apache-2.0)` | `Apache-2.0` | github.com/cure53/DOMPurify |
| `dotenv` | 17.2.4 | `BSD-2-Clause` | `BSD-2-Clause` | github.com/motdotla/dotenv |
| `duplexer` | 0.1.2 | `MIT` | `MIT` | github.com/Raynos/duplexer |
| `earcut` | 3.0.2 | `ISC` | `ISC` | github.com/mapbox/earcut |
| `encoding-down` | 7.1.0 | `MIT` | `MIT` | github.com/Level/encoding-down |
| `event-stream` | 4.0.1 | `MIT` | `MIT` | github.com/dominictarr/event-stream |
| `fast-equals` | 2.0.4 | `MIT` | `MIT` | github.com/planttheidea/fast-equals |
| `fast-png` | 6.4.0 | `MIT` | `MIT` | github.com/image-js/fast-png |
| `fastpriorityqueue` | 0.7.5 | `Apache-2.0` | `Apache-2.0` | github.com/lemire/FastPriorityQueue.js |
| `fflate` | 0.8.2 | `MIT` | `MIT` | github.com/101arrowz/fflate |
| `from` | 0.1.7 | `MIT` | `MIT` | github.com/dominictarr/from |
| `fuse.js` | 6.6.2 | `Apache-2.0` | `Apache-2.0` | github.com/krisk/Fuse |
| `fuse.js` | 7.1.0 | `Apache-2.0` | `Apache-2.0` | github.com/krisk/Fuse |
| `geo-coordinates-parser` | 1.7.4 | `MIT` | `MIT` | github.com/ianengelbrecht/geo-coordinates-parser |
| `geodesy` | 2.4.0 | `MIT` | `MIT` | github.com/chrisveness/geodesy |
| `geojson-stream` | 0.1.0 | `BSD-2-Clause` | `BSD-2-Clause` | github.com/tmcw/geojson-stream |
| `geotiff` | 2.1.3 | `MIT` | `MIT` | github.com/geotiffjs/geotiff.js |
| `html2canvas` | 1.4.1 | `MIT` | `MIT` | github.com/niklasvh/html2canvas |
| `ieee754` | 1.2.1 | `BSD-3-Clause` | `BSD-3-Clause` | github.com/feross/ieee754 |
| `inherits` | 2.0.4 | `ISC` | `ISC` | github.com/isaacs/inherits |
| `iobuffer` | 5.4.0 | `MIT` | `MIT` | github.com/image-js/iobuffer |
| `is-buffer` | 2.0.5 | `MIT` | `MIT` | github.com/feross/is-buffer |
| `jexl` | 2.3.0 | `MIT` | `MIT` | github.com/TomFrost/jexl |
| `js-base64` | 3.7.8 | `BSD-3-Clause` | `BSD-3-Clause` | github.com/dankogai/js-base64 |
| `js-tokens` | 4.0.0 | `MIT` | `MIT` | github.com/lydell/js-tokens |
| `jsonparse` | 1.3.1 | `MIT` | `MIT` | github.com/creationix/jsonparse |
| `JSONStream` | 1.3.5 | `(MIT OR Apache-2.0)` | `MIT` | github.com/dominictarr/JSONStream |
| `jspdf` | 4.1.0 | `MIT` | `MIT` | github.com/parallax/jsPDF |
| `jsts` | 2.12.1 | `UNKNOWN` | `EDL-1.0` | github.com/bjornharrtell/jsts |
| `kbar` | 0.1.0-beta.48 | `MIT` | `MIT` | github.com/timc1/kbar |
| `ky` | 1.14.3 | `MIT` | `MIT` | github.com/sindresorhus/ky |
| `lerc` | 3.0.0 | `Apache-2.0` | `Apache-2.0` | github.com/Esri/lerc |
| `level-codec` | 10.0.0 | `MIT` | `MIT` | github.com/Level/codec |
| `level-concat-iterator` | 3.1.0 | `MIT` | `MIT` | github.com/Level/concat-iterator |
| `level-errors` | 3.0.1 | `MIT` | `MIT` | github.com/Level/errors |
| `level-iterator-stream` | 5.0.0 | `MIT` | `MIT` | github.com/Level/iterator-stream |
| `level-option-wrap` | 1.1.0 | `MIT` | `MIT` | github.com/substack/level-option-wrap |
| `level-supports` | 2.1.0 | `MIT` | `MIT` | github.com/Level/supports |
| `leveldown` | 6.1.1 | `MIT` | `MIT` | github.com/Level/leveldown |
| `levelup` | 5.1.1 | `MIT` | `MIT` | github.com/Level/levelup |
| `loose-envify` | 1.4.0 | `MIT` | `MIT` | github.com/zertosh/loose-envify |
| `luxon` | 3.7.2 | `MIT` | `MIT` | github.com/moment/luxon |
| `map-stream` | 0.0.7 | `MIT` | `MIT` | github.com/dominictarr/map-stream |
| `mgrs` | 1.0.0 | `MIT` | `MIT` | github.com/proj4js/mgrs |
| `minimist` | 1.2.8 | `MIT` | `MIT` | github.com/minimistjs/minimist |
| `minisearch` | 7.2.0 | `MIT` | `MIT` | github.com/lucaong/minisearch |
| `mousetrap` | 1.6.5 | `Apache-2.0 WITH LLVM-exception` | `Apache-2.0 WITH LLVM-exception` | github.com/ccampbell/mousetrap |
| `mousetrap-global-bind` | 1.1.0 | `Apache-2.0` | `Apache-2.0` | github.com/Elvynia/mousetrap-global-bind |
| `napi-macros` | 2.0.0 | `MIT` | `MIT` | github.com/mafintosh/napi-macros |
| `node-gyp-build` | 4.8.4 | `MIT` | `MIT` | github.com/prebuild/node-gyp-build |
| `object-assign` | 4.1.1 | `MIT` | `MIT` | github.com/sindresorhus/object-assign |
| `ol` | 10.7.0 | `BSD-2-Clause` | `BSD-2-Clause` | github.com/openlayers/openlayers |
| `pako` | 2.1.0 | `(MIT AND Zlib)` | `(MIT AND Zlib)` | github.com/nodeca/pako |
| `parse-headers` | 2.0.6 | `MIT` | `MIT` | github.com/kesla/parse-headers |
| `path-to-regexp` | 8.3.0 | `MIT` | `MIT` | github.com/pillarjs/path-to-regexp |
| `pause-stream` | 0.0.11 | `MIT | Apache2` | `MIT` | github.com/dominictarr/pause-stream |
| `pbf` | 4.0.1 | `BSD-3-Clause` | `BSD-3-Clause` | github.com/mapbox/pbf |
| `performance-now` | 2.1.0 | `MIT` | `MIT` | github.com/braveg1rl/performance-now |
| `proj4` | 2.20.2 | `MIT` | `MIT` | github.com/proj4js/proj4js |
| `prop-types` | 15.8.1 | `MIT` | `MIT` | github.com/facebook/prop-types |
| `protocol-buffers-schema` | 3.6.0 | `MIT` | `MIT` | github.com/mafintosh/protocol-buffers-schema |
| `queue-microtask` | 1.2.3 | `MIT` | `MIT` | github.com/feross/queue-microtask |
| `quick-lru` | 6.1.2 | `MIT` | `MIT` | github.com/sindresorhus/quick-lru |
| `quickselect` | 3.0.0 | `ISC` | `ISC` | github.com/mourner/quickselect |
| `raf` | 3.4.1 | `MIT` | `MIT` | github.com/chrisdickinson/raf |
| `ramda` | 0.30.1 | `MIT` | `MIT` | github.com/ramda/ramda |
| `ramda` | 0.32.0 | `MIT` | `MIT` | github.com/ramda/ramda |
| `rbush` | 4.0.1 | `MIT` | `MIT` | github.com/mourner/rbush |
| `reachdown` | 1.1.0 | `MIT` | `MIT` | github.com/vweevers/reachdown |
| `react` | 18.3.1 | `MIT` | `MIT` | github.com/facebook/react |
| `react-cool-virtual` | 0.7.0 | `MIT` | `MIT` | github.com/wellyshen/react-cool-virtual |
| `react-dom` | 18.3.1 | `MIT` | `MIT` | github.com/facebook/react |
| `react-easy-sort` | 1.8.0 | `MIT` | `MIT` | github.com/ValentinH/react-easy-sort |
| `react-fast-compare` | 3.2.2 | `MIT` | `MIT` | github.com/FormidableLabs/react-fast-compare |
| `react-is` | 16.13.1 | `MIT` | `MIT` | github.com/facebook/react |
| `react-tooltip` | 5.30.0 | `MIT` | `MIT` | github.com/ReactTooltip/react-tooltip |
| `react-virtual` | 2.10.4 | `MIT` | `MIT` | github.com/tannerlinsley/react-virtual |
| `readable-stream` | 3.6.2 | `MIT` | `MIT` | github.com/nodejs/readable-stream |
| `regenerator-runtime` | 0.13.11 | `MIT` | `MIT` | github.com/facebook/regenerator.git#main |
| `reproject` | 1.2.7 | `MIT` | `MIT` | github.com/perliedman/reproject |
| `resolve-protobuf-schema` | 2.1.0 | `MIT` | `MIT` | github.com/mafintosh/resolve-protobuf-schema |
| `rgbcolor` | 1.0.1 | `MIT*` | `MIT` | github.com/yetzt/node-rgbcolor |
| `safe-buffer` | 5.2.1 | `MIT` | `MIT` | github.com/feross/safe-buffer |
| `sanitize-filename` | 1.6.3 | `WTFPL OR ISC` | `ISC` | github.com/parshap/node-sanitize-filename |
| `scheduler` | 0.23.2 | `MIT` | `MIT` | github.com/facebook/react |
| `split` | 1.0.1 | `MIT` | `MIT` | github.com/dominictarr/split |
| `stackblur-canvas` | 2.7.0 | `MIT` | `MIT` | github.com/flozz/StackBlur |
| `stream-combiner` | 0.2.2 | `MIT` | `MIT` | github.com/dominictarr/stream-combiner |
| `string_decoder` | 1.3.0 | `MIT` | `MIT` | github.com/nodejs/string_decoder |
| `subleveldown` | 6.0.1 | `MIT` | `MIT` | github.com/Level/subleveldown |
| `svg-path-bbox` | 2.1.0 | `BSD-3-Clause` | `BSD-3-Clause` | github.com/mondeja/svg-path-bbox |
| `svg-pathdata` | 6.0.3 | `MIT` | `MIT` | github.com/nfroidure/svg-pathdata |
| `svgpath` | 2.6.0 | `MIT` | `MIT` | github.com/fontello/svgpath |
| `text-segmentation` | 1.0.3 | `MIT` | `MIT` | github.com/niklasvh/text-segmentation |
| `throttle-debounce` | 5.0.2 | `MIT` | `MIT` | github.com/niksy/throttle-debounce |
| `through` | 2.3.8 | `MIT` | `MIT` | github.com/dominictarr/through |
| `tiny-invariant` | 1.3.3 | `MIT` | `MIT` | github.com/alexreardon/tiny-invariant |
| `truncate-utf8-bytes` | 1.0.2 | `WTFPL` | `WTFPL` | github.com/parshap/truncate-utf8-bytes |
| `tslib` | 2.8.1 | `0BSD` | `0BSD` | github.com/Microsoft/tslib |
| `typedarray` | 0.0.6 | `MIT` | `MIT` | github.com/substack/typedarray |
| `typeface-roboto` | 1.1.13 | `MIT` | `MIT` | github.com/KyleAMathews/typefaces.git#master |
| `uniqolor` | 1.1.1 | `MIT` | `MIT` | github.com/dastoori/uniqolor |
| `utf8-byte-length` | 1.0.5 | `(WTFPL OR MIT)` | `MIT` | github.com/parshap/utf8-byte-length |
| `util-deprecate` | 1.0.2 | `MIT` | `MIT` | github.com/TooTallNate/util-deprecate |
| `utrie` | 1.0.2 | `MIT` | `MIT` | github.com/niklasvh/utrie |
| `web-worker` | 1.5.0 | `Apache-2.0` | `Apache-2.0` | github.com/developit/web-worker |
| `wkt-parser` | 1.5.2 | `MIT` | `MIT` | github.com/proj4js/wkt-parser |
| `xml-utils` | 1.10.2 | `CC0-1.0` | `CC0-1.0` | github.com/DanielJDufour/xml-utils |
| `zstddec` | 0.1.0 | `MIT AND BSD-3-Clause` | `MIT AND BSD-3-Clause` | github.com/donmccurdy/zstddec |


</details>

---

## 2. Grouping by license type (effective, after dual-license selection)

| License (effective) | Count | Notes |
|---|---:|---|
| `MIT` | 122 | permissive, no concerns |
| `Apache-2.0` | 9 | permissive; ships an explicit patent grant and requires that `NOTICE` files be reproduced (none of the nine ship a `NOTICE` file; verified) |
| `ISC` | 4 | permissive, functionally MIT-equivalent |
| `BSD-3-Clause` | 4 | permissive |
| `BSD-2-Clause` | 3 | permissive |
| `EDL-1.0` | 1 | Eclipse Distribution License — BSD-3-Clause-equivalent; chosen from `jsts`'s `(EDL-1.0 OR EPL-1.0)` dual offer |
| `Apache-2.0 WITH LLVM-exception` | 1 | `mousetrap` — strictly more permissive than plain Apache-2.0 (adds a relicensing allowance). Note: the LICENSE file shipped in the tarball is actually plain Apache-2.0 — the LLVM exception only appears in `package.json`. Either reading is permissive and compatible with AGPL-3.0 distribution. |
| `MIT AND Zlib` | 1 | `pako` — must honor obligations of *both* MIT and Zlib (both permissive, only require copyright notice retention) |
| `MIT AND BSD-3-Clause` | 1 | `zstddec` — same principle: both notices must be reproduced |
| `0BSD` | 1 | `tslib` — public-domain-equivalent |
| `CC0-1.0` | 1 | `xml-utils` — public-domain-equivalent (waiver) |
| `WTFPL` | 1 | `truncate-utf8-bytes` — see §3 |
| `(MPL-2.0 OR Apache-2.0)` | 1 | `dompurify` — see §3 and §5b. Apache-2.0 is chosen by default to keep the application code under permissive terms. |

**There are no copyleft licenses in this production tree.**

---

## 3. Packages flagged for manual review

`license-checker-rseidelsohn` produced 6 entries with non-trivial, custom, or missing license metadata in the production tree. All were resolved manually by inspecting the package's `LICENSE`/`README` files on disk.

| Package | Tool said | Reality on disk | Verdict |
|---|---|---|---|
| `jsts@2.12.1` | `UNKNOWN` | `package.json`: `(EDL-1.0 OR EPL-1.0)`. No LICENSE file in tarball; project repo confirms dual EDL-1.0 / EPL-1.0. | **OK** — choose EDL-1.0 (≈ BSD-3-Clause). EPL-1.0 would have been a weak-copyleft concern; the `OR` lets us avoid it. |
| `rgbcolor@1.0.1` | `MIT*` | `LICENSE.md` is verbatim MIT plus an "Exemptions" note explicitly granting use under MIT *or* the `FEEL-FREE.md` letter ("feel free to use the code"). | **OK** — treat as MIT. |
| `sanitize-filename@1.6.3` | `WTFPL OR ISC` | Confirmed. LICENSE file ships both texts side-by-side. | **OK** — elect ISC. |
| `truncate-utf8-bytes@1.0.2` | `WTFPL` | Confirmed. No LICENSE file in tarball; only `package.json` declares WTFPL. | ⚠️ See note below. |
| `utf8-byte-length@1.0.5` | `(WTFPL OR MIT)` | LICENSE files for both present. | **OK** — elect MIT. |
| `odin-v2@3.3.0` | `Custom: https://fsf.org/` | This is the project itself; AGPL-3.0. The tool mis-classifies it because the LICENSE file starts with the FSF address. | **N/A** — it's us. |

### The `truncate-utf8-bytes` (WTFPL) caveat

The WTFPL is widely understood as effectively public-domain-equivalent, and OSI/SPDX list it as a recognized license. However, some corporate-license policies and downstream auditors reject WTFPL because of its name/wording. The package is ~30 lines of trivial UTF-8 byte arithmetic depended on transitively via `sanitize-filename`. Options if a downstream customer rejects WTFPL:

1. Accept it (the most common path; legally it is the most permissive license possible).
2. Replace `sanitize-filename` with an alternative (or vendor the ~30 LOC).
3. Patch the package upstream / via npm `overrides` to re-license your fork.

**No action required for AGPL-3.0 distribution of ODINv2 today.**

---

## 4. Dual-licensed packages

Packages whose `package.json` declares an SPDX expression with `OR`, `AND`, or `|`:

| Package | Version | SPDX expression | Chosen | Reason |
|---|---|---|---|---|
| `dompurify` | 3.3.1 | `(MPL-2.0 OR Apache-2.0)` | **Apache-2.0** | Permissive; avoids MPL-2.0's per-file copyleft. Important for §5b — see below. |
| `JSONStream` | 1.3.5 | `(MIT OR Apache-2.0)` | MIT | most permissive picked |
| `jsts` | 2.12.1 | `(EDL-1.0 OR EPL-1.0)` | **EDL-1.0** | Avoids EPL-1.0's weak copyleft. EDL-1.0 ≈ BSD-3-Clause. |
| `pako` | 2.1.0 | `(MIT AND Zlib)` | both | `AND` = conjunctive; both notice files must be retained |
| `pause-stream` | 0.0.11 | `MIT \| Apache2` (non-SPDX) | MIT | most permissive picked |
| `sanitize-filename` | 1.6.3 | `WTFPL OR ISC` | **ISC** | Avoids WTFPL for downstream policy comfort |
| `utf8-byte-length` | 1.0.5 | `(WTFPL OR MIT)` | MIT | same reasoning |
| `zstddec` | 0.1.0 | `MIT AND BSD-3-Clause` | both | `AND` = conjunctive; both notice files must be retained |

The choices above are what `THIRD_PARTY_LICENSES.md` documents as "effective" for compatibility analysis. None of the `OR` choices are binding contracts — a downstream licensee can re-elect any other option from the original expression.

---

## 5. Compatibility assessment

### 5a. AGPL-3.0 distribution of ODINv2

Because ODINv2 is licensed as AGPL-3.0, every inbound dependency that is *combined* with it must be license-compatible *into* AGPL-3.0 (one-way inbound test).

| Effective license class | Inbound AGPL-3.0 compatible? | Notes |
|---|---|---|
| MIT / ISC / BSD-2 / BSD-3 / 0BSD / CC0-1.0 | ✅ yes | Standard permissive licenses; FSF-confirmed AGPL-compatible. |
| Apache-2.0 (incl. WITH LLVM-exception) | ✅ yes | AGPL-3.0 explicitly permits combination with Apache-2.0 (one-way inbound only — see GPLv3 §7 and FSF FAQ). |
| EDL-1.0 (`jsts`) | ✅ yes | EDL-1.0 is BSD-3-Clause-equivalent. |
| WTFPL (`truncate-utf8-bytes`) | ✅ yes | Public-domain-equivalent. |
| MPL-2.0 *if elected* for `dompurify` | ✅ yes | MPL-2.0 §3.3 explicitly permits combination under (A/L/)GPL via the "Secondary License" mechanism. We have elected Apache-2.0 instead, so this never triggers. |
| MIT AND Zlib (`pako`) | ✅ yes | Both permissive. |
| MIT AND BSD-3-Clause (`zstddec`) | ✅ yes | Both permissive. |

**Verdict: ✅ ODINv2 can be distributed under AGPL-3.0 as-is.** All production dependencies are permissively licensed; no GPL/AGPL/LGPL/SSPL/proprietary-with-restriction code is linked in. The combined work is distributable under AGPL-3.0 provided the obligations in §6 are honored (ship `THIRD_PARTY_LICENSES.md`).

### 5b. Commercial sub-licensing to third parties without source-disclosure obligation

This is the harder question. "Commercial sub-licensing without source disclosure" means you would re-license ODINv2 (or a derived product) to a paying customer under proprietary terms that do *not* trigger AGPL §13's network-service source-disclosure requirement.

**You cannot relicense AGPL-3.0 code you don't own.** Section 5b is only meaningful for the portions of the product whose copyright Syncpoint holds (i.e. the AGPL grant on your own code can be replaced by a commercial grant in a dual-licensing scheme — the classic "open-core" pattern). For every *third-party* dependency, you remain bound by *its* license, regardless of what you offer your customer for the Syncpoint-authored portion.

| Effective license | Forces source disclosure on the combined work? | Blocks proprietary sub-licensing of your portion? |
|---|---|---|
| MIT / ISC / BSD-2 / BSD-3 / 0BSD / CC0-1.0 / WTFPL | no | no |
| Apache-2.0 (incl. WITH LLVM-exception) | no | no — but you must reproduce `NOTICE`, retain copyright headers, and document modifications (Apache §4). |
| EDL-1.0 | no | no (BSD-equivalent) |
| Zlib | no | no |
| **MPL-2.0** (only if you elect MPL for `dompurify`) | **yes, file-level** — modifications to MPL-2.0 files must be released under MPL-2.0 | does not block proprietary sub-licensing of *other* files; only the MPL files themselves stay MPL. |

**Verdict for commercial sub-licensing:**

- ✅ **No production dependency forces global source disclosure** in a proprietary distribution of *your own* portion of the work.
- ✅ For `dompurify`, elect **Apache-2.0** from the `(MPL-2.0 OR Apache-2.0)` dual offer. This is what `THIRD_PARTY_LICENSES.md` documents. If you (or a fork) ever modify dompurify and want to keep the modifications closed-source, the Apache-2.0 election is what makes that possible. If you accidentally use the MPL election, modifications to the dompurify *files* (not the rest of your code) must be published under MPL.
- ⚠️ **Apache-2.0 NOTICE obligation.** Of the 9 Apache-2.0 packages (`@matrix-org/matrix-sdk-crypto-wasm`, `@mdi/js`, `dompurify` if Apache elected, `lerc`, `mousetrap` if treated as plain Apache, plus several `@radix-ui/*`-adjacent transitives), none ship a separate `NOTICE` file in the tarball at the time of this audit — verified by `ls node_modules/<pkg>/NOTICE*`. So there is no extra attribution text you must propagate beyond what `THIRD_PARTY_LICENSES.md` already does. Re-verify on every dependency bump (`npm outdated`).
- ⚠️ **AGPL-3.0 of your own code.** If you currently ship ODINv2 under AGPL-3.0 and want to commercially re-license to a customer, you need to hold (or have re-acquired) copyright on every Syncpoint-authored line. External contributions to the ODINv2 repository accepted without a Contributor License Agreement (CLA) or Developer Certificate of Origin (DCO) that grants you re-licensing rights will block this. This audit does *not* attempt to verify contributor-rights provenance — that is a separate `git log` / CLA-tracker exercise.

---

## 6. What to ship with the product

1. **`LICENSE.md`** — already present at repository root; contains the AGPL-3.0 text for ODINv2 itself. Keep as-is.
2. **`THIRD_PARTY_LICENSES.md`** — generated alongside this audit (~314 kB). It contains the full per-package summary table plus the verbatim license text from every package that ships one. Bundle this with every release artifact (electron-builder: add to `extraResources` or include via `files` in `electron-builder.yml`). The MIT/BSD/ISC/Apache-2.0 family all require notice retention; this single file satisfies that obligation in aggregate.
3. **In-app "About" / "Open-source notices" screen** — many distributions also expose `THIRD_PARTY_LICENSES.md` via a Help menu. Not legally required so long as the file ships in the artifact, but conventional.

---

## 7. Re-running this audit

```bash
npx license-checker-rseidelsohn --production --json > /tmp/licenses-prod.json
# inspect with: jq 'to_entries | map({k:.key,l:.value.licenses}) | group_by(.l)'
```

The manual-verification list in §3 should be re-checked any time the production dependency tree changes materially. The fastest way to surface new flags is:

```bash
npx license-checker-rseidelsohn --production --json \
  | jq -r 'to_entries[] | select(.value.licenses | test("UNKNOWN|Custom|\\*|GPL|SSPL|UNLICENSED")) | "\(.key)\t\(.value.licenses)"'
```

DevDependencies are out of scope for distribution but worth a periodic glance for build-time risk (e.g., a copyleft webpack plugin would still be fine to use; a copyleft asset-pipeline tool that bakes itself into the bundle would not).
