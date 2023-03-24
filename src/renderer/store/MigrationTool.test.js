import assert from 'assert'
import * as R from 'ramda'
import MigrationTool from './MigrationTool'
import * as L from '../../shared/level'


const schema = async (db, kvs = []) => {
  const schema = L.schemaDB(db)
  const ops = R.compose(
    R.map(([k, v]) => L.putOp(k, v)),
    R.filter(([k, v]) => !R.isNil(v))
  )(kvs)

  await schema.batch(ops)
  return schema
}

const json = async (db, kvs = []) => {
  const json = L.jsonDB(db)
  const ops = R.map(([k, v]) => L.putOp(k, v), kvs)
  await json.batch(ops)
  return json
}

const fixtures = [
  {
    characteristic: MigrationTool.REDUNDANT_IDENTIFIERS,
    actual: undefined,
    wanted: false,
    initial: [['key', { value: 'a', id: 'key' }]],
    expected: [['key', { value: 'a' }]]
  },
  {
    characteristic: MigrationTool.REDUNDANT_IDENTIFIERS,
    actual: false,
    wanted: true,
    initial: [['key', { value: 'a' }]],
    expected: [['key', { value: 'a', id: 'key' }]]
  },
  {
    characteristic: MigrationTool.INLINE_TAGS,
    actual: undefined,
    wanted: false,
    initial: [['key', { value: 'a', tags: ['tag'] }]],
    expected: [
      ['key', { value: 'a' }],
      ['tags+key', ['tag']]
    ]
  },
  {
    characteristic: MigrationTool.INLINE_TAGS,
    actual: false,
    wanted: true,
    initial: [
      ['key', { value: 'a' }],
      ['tags+key', ['tag']]
    ],
    expected: [['key', { value: 'a', tags: ['tag'] }]]
  },
  {
    characteristic: MigrationTool.INLINE_FLAGS,
    actual: undefined,
    wanted: false,
    initial: [['key', { value: 'a', hidden: true, locked: true, shared: true }]],
    expected: [
      ['hidden+key', true],
      ['key', { value: 'a' }],
      ['locked+key', true],
      ['shared+key', true]
    ]
  },
  {
    characteristic: MigrationTool.INLINE_FLAGS,
    actual: false,
    wanted: true,
    initial: [
      ['hidden+key', true],
      ['key', { value: 'a' }],
      ['locked+key', true],
      ['shared+key', true]
    ],
    expected: [['key', { value: 'a', hidden: true, locked: true, shared: true }]]
  },
  {
    characteristic: MigrationTool.DEFAULT_TAG,
    actual: undefined,
    wanted: false,
    initial: [['tags+layer:xyz', ['default', 'other']]],
    expected: [
      ['default+layer:xyz', true],
      ['tags+layer:xyz', ['other']]
    ]
  },
  {
    characteristic: MigrationTool.DEFAULT_TAG,
    actual: false,
    wanted: true,
    initial: [
      ['default+layer:xyz', true],
      ['tags+layer:xyz', ['other']]
    ],
    expected: [['tags+layer:xyz', ['other', 'default']]]
  },
  {
    characteristic: MigrationTool.INLINE_STYLES,
    actual: undefined,
    wanted: false,
    initial: [['feature:xyz', { properties: { value: 'a', style: { color: 'red' } } }]],
    expected: [
      ['feature:xyz', { properties: { value: 'a' } }],
      ['style+feature:xyz', { color: 'red' }]
    ]
  },
  {
    characteristic: MigrationTool.INLINE_STYLES,
    actual: false,
    wanted: true,
    initial: [
      ['feature:xyz', { properties: { value: 'a' } }],
      ['style+feature:xyz', { color: 'red' }]
    ],
    expected: [['feature:xyz', { properties: { value: 'a', style: { color: 'red' } } }]]
  }
]

describe('MigrationTool', function () {

  fixtures.forEach(fixture => {
    it(`${fixture.characteristic} [${fixture.actual} -> ${fixture.wanted}]`, async function () {
      const db = L.leveldb()
      const schemaDB = await schema(db, [[fixture.characteristic, fixture.actual]])
      const jsonDB = await json(db, fixture.initial)
      const tools = new MigrationTool(db, { [fixture.characteristic]: fixture.wanted })
      await tools.bootstrap()
      assert.equal(await L.get(schemaDB, fixture.characteristic), fixture.wanted)
      const actual = await L.tuples(jsonDB)
      assert.deepStrictEqual(actual, fixture.expected)
    })
  })
})
