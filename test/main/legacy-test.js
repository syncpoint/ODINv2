import assert from 'assert'
import { promises as fs } from 'fs'
import path from 'path'
import * as Legacy from '../../src/main/legacy'


describe('legacy', async function () {
  const directory = path.resolve('./test/main/home')

  const readJSON = async filename => {
    const file = await fs.readFile(filename, 'utf8')
    return JSON.parse(file)
  }

  it('#projects', async function () {
    const home = Legacy.home(directory)
    const actual = await Legacy.projects(home)
    const expected = await readJSON('./test/main/legacy-projects.json')
    assert.deepStrictEqual(actual, expected)
  })

  it('#source', async function () {
    const home = Legacy.home(directory)
    const actual = await home.sources()
    const expected = await readJSON('./test/main/legacy-sources.json')
    assert.deepStrictEqual(actual, expected)
  })
})
