import assert from 'assert'
import { resolve } from 'path'
import { readJSON } from '../../../src/main/legacy/io'
import { readProjects } from '../../../src/main/legacy/projects'

const pathname = dir => resolve(__dirname, dir)

it('legacy-projects', async function () {
  const actual = await readProjects(pathname('./data/home'))

  // Remove 'empty' layer from project 0a44dfaf-1774-482a-bc47-5efcfb8587e6
  // since it is assigned a random id which cannot be compared with static
  // reference data.
  const layers = actual[0].layers
  actual[0].layers = layers.filter(layer => layer.name !== 'empty')
  const expected = await readJSON(pathname('./data/legacy-projects.json'))
  assert.deepStrictEqual(actual, expected)
})
