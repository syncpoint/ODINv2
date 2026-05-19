#!/usr/bin/env node
/**
 * Fails if any production dependency uses a license outside the allow-list
 * documented in LICENSE_AUDIT.md. Intended for CI and for local use after
 * dependency bumps:
 *
 *   npm run licenses:check
 *
 * On failure, inspect the offending package and either:
 *   - replace it,
 *   - elect a permissive option from its SPDX expression and extend
 *     ALLOWED_EXPRESSIONS below,
 *   - or (last resort) extend ALLOWED_PACKAGES with a justification.
 */

const { spawnSync } = require('child_process')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

// Single SPDX identifiers that are unconditionally accepted.
const ALLOWED = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'Apache-2.0 WITH LLVM-exception',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',
  'EDL-1.0',
  'Zlib'
])

// Full SPDX expressions we explicitly accept (after manual review).
// The "why" mirrors the dual-license decisions in LICENSE_AUDIT.md §4.
const ALLOWED_EXPRESSIONS = new Set([
  '(MIT OR Apache-2.0)',
  '(MIT OR CC0-1.0)',
  '(MPL-2.0 OR Apache-2.0)',          // dompurify: elect Apache-2.0
  '(EDL-1.0 OR EPL-1.0)',              // jsts: elect EDL-1.0
  '(MIT AND Zlib)',                    // pako: both permissive
  '(WTFPL OR MIT)',                    // utf8-byte-length: elect MIT
  '(MIT AND Zlib)',
  'MIT AND BSD-3-Clause',              // zstddec: both permissive
  'WTFPL OR ISC',                      // sanitize-filename: elect ISC
  'MIT | Apache2',                     // pause-stream: non-SPDX, elect MIT
  'WTFPL'                              // truncate-utf8-bytes: see LICENSE_AUDIT.md §3
])

// Per-package exceptions for license-checker quirks that we have verified by
// reading the actual LICENSE file. Maps `name@version` to a comment.
const ALLOWED_PACKAGES = {
  'jsts@2.12.1': 'license-checker reports UNKNOWN; package.json declares (EDL-1.0 OR EPL-1.0); we elect EDL-1.0',
  'rgbcolor@1.0.1': 'license-checker reports MIT*; LICENSE.md is verbatim MIT'
}

function runChecker () {
  const result = spawnSync('npx', ['--yes', 'license-checker-rseidelsohn', '--production', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  })
  if (result.status !== 0) {
    process.stderr.write(result.stderr || 'license-checker failed\n')
    process.exit(result.status || 1)
  }
  return JSON.parse(result.stdout)
}

const data = runChecker()
const violations = []

for (const key of Object.keys(data)) {
  if (key.startsWith('odin-v2@')) continue
  let lic = data[key].licenses || ''
  if (Array.isArray(lic)) lic = lic.join(' | ')
  if (ALLOWED.has(lic)) continue
  if (ALLOWED_EXPRESSIONS.has(lic)) continue
  if (ALLOWED_PACKAGES[key]) continue
  violations.push({ pkg: key, license: lic })
}

if (violations.length > 0) {
  process.stderr.write('License gate FAILED. Disallowed or unknown licenses:\n\n')
  for (const v of violations) {
    process.stderr.write(`  ${v.pkg}\n    license: ${v.license}\n`)
  }
  process.stderr.write('\nReview each entry, then update tools/check-licenses.js\n')
  process.stderr.write('and regenerate THIRD_PARTY_LICENSES.md (npm run licenses:generate).\n')
  process.stderr.write('See LICENSE_AUDIT.md §3 for the verification procedure.\n')
  process.exit(1)
}

const counts = Object.keys(data).length - 1 // subtract odin-v2 itself
process.stdout.write(`License gate OK. ${counts} production packages, all permissive.\n`)
