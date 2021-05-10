import assert from 'assert'
import levelmem from 'level-mem'
import { readJSON } from '../../src/main/legacy/io'
import Master from '../../src/main/Master'

describe('Master', async function () {

  it('transferSources', async function () {
    const expected = await readJSON('./test/data/sources.json')
    const db = levelmem({ valueEncoding: 'json' })
    const master = new Master(db)
    await master.transferSources(expected)
    const actual = await master.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON('./test/data/legacy-projects.json')
    const db = levelmem({ valueEncoding: 'json' })
    const master = new Master(db)
    await master.transferMetadata(projects)
    const actual = await master.getProjects()
    const expected = await readJSON('./test/data/metadata.json')
    assert.deepStrictEqual(actual, expected)
  })
})
