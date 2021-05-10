import assert from 'assert'
import path from 'path'
import { readJSON } from '../../src/main/legacy/io'
import { readProjects } from '../../src/main/legacy/projects'

it('legacy-projects', async function () {
  const location = path.resolve('./test/data/home')
  const actual = await readProjects(location)

  // Remove 'empty' layer from project 0a44dfaf-1774-482a-bc47-5efcfb8587e6
  // since it is assigned a random id which cannot be compared with static
  // reference data.
  const layers = actual['project:0a44dfaf-1774-482a-bc47-5efcfb8587e6'].layers
  actual['project:0a44dfaf-1774-482a-bc47-5efcfb8587e6'].layers = Object.fromEntries(
    Object.entries(layers).filter(([_, layer]) => layer.name !== 'empty')
  )

  const expected = await readJSON('./test/data/legacy-projects.json')
  assert.deepStrictEqual(actual, expected)
})
