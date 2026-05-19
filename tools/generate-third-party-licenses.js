#!/usr/bin/env node
/**
 * Generates THIRD_PARTY_LICENSES.md from the npm production dependency tree.
 *
 * Run this after any dependency bump (minor/major in particular):
 *   npm run licenses:generate
 *
 * The companion script `npm run licenses:check` enforces the allow-list of
 * acceptable licenses and fails CI if a copyleft or unknown license appears.
 *
 * See LICENSE_AUDIT.md for the policy rationale.
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const NODE_MODULES = path.join(ROOT, 'node_modules')
const OUT = path.join(ROOT, 'THIRD_PARTY_LICENSES.md')

// Packages whose npm tarball ships no LICENSE file. Verified manually against
// the upstream repository. Update when the dep set changes.
const MANUAL_NOTICES = {
  '@radix-ui/react-compose-refs': 'Copyright (c) 2022 WorkOS. MIT License — see https://github.com/radix-ui/primitives/blob/main/LICENSE',
  '@radix-ui/react-use-layout-effect': 'Copyright (c) 2022 WorkOS. MIT License — see https://github.com/radix-ui/primitives/blob/main/LICENSE',
  '@reach/observe-rect': 'Copyright (c) 2018-present, React Training LLC. MIT License — see https://github.com/reach/observe-rect',
  '@syncpoint/matrix-client-api': 'Copyright (c) Syncpoint GmbH. MIT License.',
  '@syncpoint/signs': 'Copyright (c) Syncpoint GmbH. MIT License.',
  'geojson-stream': 'Copyright (c) Tom MacWright. BSD-2-Clause — see https://github.com/mapbox/geojson-stream',
  'jsts': 'Copyright (c) 2016 Björn Harrtell. Dual-licensed under EDL-1.0 (BSD-3-Clause-like) and EPL-1.0. Recipients may choose either. See https://github.com/bjornharrtell/jsts',
  'lerc': 'Copyright 2015-2024 Esri. Apache License 2.0 — see https://github.com/Esri/lerc/blob/master/LICENSE',
  'react-easy-sort': 'Copyright (c) Valentin Hervieu. MIT License — see https://github.com/ValentinH/react-easy-sort',
  'react-virtual': 'Copyright (c) Tanner Linsley. MIT License — see https://github.com/TanStack/virtual',
  'truncate-utf8-bytes': 'Copyright (c) Carl Xiong. WTFPL — see http://www.wtfpl.net/',
  'typeface-roboto': 'Copyright (c) Kyle Mathews. Font files: Roboto by Christian Robertson, Google (Apache-2.0). Package wrapper: MIT.'
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

function findLicenseTexts (pkgName) {
  const dir = path.join(NODE_MODULES, pkgName)
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir).sort()) {
    const u = entry.toUpperCase()
    if (!u.startsWith('LICENSE') && !u.startsWith('LICENCE') && !u.startsWith('COPYING') && !u.startsWith('NOTICE')) continue
    const full = path.join(dir, entry)
    try {
      const text = fs.readFileSync(full, 'utf8').trim()
      if (text) out.push({ name: entry, text })
    } catch (_) { /* unreadable file — skip */ }
  }
  return out
}

function toRows (data) {
  const rows = []
  for (const key of Object.keys(data)) {
    if (key.startsWith('odin-v2@')) continue
    const idx = key.lastIndexOf('@')
    const name = key.slice(0, idx)
    const version = key.slice(idx + 1)
    const info = data[key]
    let license = info.licenses || ''
    if (Array.isArray(license)) license = license.join(' | ')
    rows.push({
      name,
      version,
      license,
      repository: info.repository || '',
      publisher: info.publisher || ''
    })
  }
  rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  return rows
}

function render (rows) {
  const today = new Date().toISOString().slice(0, 10)
  const lines = []
  lines.push('# THIRD-PARTY LICENSES — ODINv2')
  lines.push('')
  lines.push('This file aggregates the license notices for every third-party package distributed')
  lines.push('with the ODINv2 application. It is generated from the npm production dependency tree')
  lines.push('(`npm ls --omit=dev`) by `tools/generate-third-party-licenses.js`.')
  lines.push('')
  lines.push(`Last generated: ${today}.`)
  lines.push('')
  lines.push('ODINv2 itself is licensed under the GNU Affero General Public License v3.0 (see `LICENSE.md`).')
  lines.push('The packages enumerated below remain under the terms shown for each entry; nothing in')
  lines.push('this file modifies those terms. See `LICENSE_AUDIT.md` for the per-license compatibility')
  lines.push('analysis behind this distribution.')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Summary table')
  lines.push('')
  lines.push('| Package | Version | License | Repository |')
  lines.push('|---|---|---|---|')
  for (const r of rows) {
    const repo = r.repository ? r.repository.replace(/^git\+/, '').replace(/^https:\/\//, '') : '—'
    lines.push(`| \`${r.name}\` | ${r.version} | \`${r.license}\` | ${repo} |`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Full license texts')
  lines.push('')
  for (const r of rows) {
    lines.push(`### ${r.name} @ ${r.version}`)
    lines.push(`- **Declared license:** \`${r.license}\``)
    if (r.repository) lines.push(`- **Repository:** ${r.repository}`)
    if (r.publisher) lines.push(`- **Publisher:** ${r.publisher}`)
    lines.push('')
    const texts = findLicenseTexts(r.name)
    if (texts.length > 0) {
      for (const t of texts) {
        lines.push(`<details><summary>${t.name}</summary>`)
        lines.push('')
        lines.push('```')
        lines.push(t.text)
        lines.push('```')
        lines.push('')
        lines.push('</details>')
        lines.push('')
      }
    } else if (MANUAL_NOTICES[r.name]) {
      lines.push('```')
      lines.push(MANUAL_NOTICES[r.name])
      lines.push('```')
      lines.push('')
    } else {
      lines.push('> No LICENSE file in the published tarball; refer to the repository above.')
      lines.push('> If you are adding this package, please add an entry to `MANUAL_NOTICES`')
      lines.push('> in `tools/generate-third-party-licenses.js`.')
      lines.push('')
    }
  }
  return lines.join('\n') + '\n'
}

const data = runChecker()
const rows = toRows(data)
const output = render(rows)
fs.writeFileSync(OUT, output)
process.stdout.write(`Wrote ${OUT} (${rows.length} packages, ${output.length} bytes)\n`)

const missing = rows.filter(r => findLicenseTexts(r.name).length === 0 && !MANUAL_NOTICES[r.name])
if (missing.length > 0) {
  process.stderr.write(`\nWARNING: ${missing.length} package(s) have no LICENSE file and no manual entry:\n`)
  for (const m of missing) process.stderr.write(`  - ${m.name}@${m.version}\n`)
  process.stderr.write('Add them to MANUAL_NOTICES in this script.\n')
  process.exit(2)
}
