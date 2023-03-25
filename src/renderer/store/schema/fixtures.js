export default [
  {
    id: 'ids',
    actual: undefined,
    wanted: 'KEY-ONLY',
    initial: [['key', { value: 'a', id: 'key' }]],
    expected: [['key', { value: 'a' }]]
  },
  {
    id: 'ids',
    actual: 'KEY-ONLY',
    wanted: 'VALUE',
    initial: [['key', { value: 'a' }]],
    expected: [['key', { value: 'a', id: 'key' }]]
  },
  {
    id: 'tags',
    actual: undefined,
    wanted: 'SEPARATE',
    initial: [['key', { value: 'a', tags: ['tag'] }]],
    expected: [
      ['key', { value: 'a' }],
      ['tags+key', ['tag']]
    ]
  },
  {
    id: 'tags',
    actual: 'SEPARATE',
    wanted: 'INLINE',
    initial: [
      ['key', { value: 'a' }],
      ['tags+key', ['tag']]
    ],
    expected: [['key', { value: 'a', tags: ['tag'] }]]
  },
  {
    id: 'flags',
    actual: undefined,
    wanted: 'SEPARATE',
    initial: [['key', { value: 'a', hidden: true, locked: true, shared: true }]],
    expected: [
      ['hidden+key', true],
      ['key', { value: 'a' }],
      ['locked+key', true],
      ['shared+key', true]
    ]
  },
  {
    id: 'flags',
    actual: 'SEPARATE',
    wanted: 'INLINE',
    initial: [
      ['hidden+key', true],
      ['key', { value: 'a' }],
      ['locked+key', true],
      ['shared+key', true]
    ],
    expected: [['key', { value: 'a', hidden: true, locked: true, shared: true }]]
  },
  {
    id: 'default-tag',
    actual: undefined,
    wanted: 'SEPARATE',
    initial: [['tags+layer:xyz', ['default', 'other']]],
    expected: [
      ['default+layer:xyz', true],
      ['tags+layer:xyz', ['other']]
    ]
  },
  {
    id: 'default-tag',
    actual: 'SEPARATE',
    wanted: 'TAGS',
    initial: [
      ['default+layer:xyz', true],
      ['tags+layer:xyz', ['other']]
    ],
    expected: [['tags+layer:xyz', ['other', 'default']]]
  },
  {
    id: 'styles',
    actual: undefined,
    wanted: 'SEPARATE',
    initial: [['feature:xyz', { properties: { value: 'a', style: { color: 'red' } } }]],
    expected: [
      ['feature:xyz', { properties: { value: 'a' } }],
      ['style+feature:xyz', { color: 'red' }]
    ]
  },
  {
    id: 'styles',
    actual: 'SEPARATE',
    wanted: 'PROPERTIES',
    initial: [
      ['feature:xyz', { properties: { value: 'a' } }],
      ['style+feature:xyz', { color: 'red' }]
    ],
    expected: [['feature:xyz', { properties: { value: 'a', style: { color: 'red' } } }]]
  }
]
