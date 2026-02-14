import assert from 'assert'
import fs from 'fs'
import path from 'path'

// Verify that the default value for ui.properties is 'properties' (panel open)
// in all components that consume this preference. This is a source-level test
// to prevent accidental regressions.

const SRC = path.resolve('src/renderer/components')

const extractMementoDefault = (source, key) => {
  // Match useMemento('ui.properties', <default>)
  const pattern = new RegExp(`useMemento\\s*\\(\\s*'${key}'\\s*,\\s*'([^']*)'\\s*\\)`)
  const match = source.match(pattern)
  return match ? match[1] : null
}

describe('Properties panel default value', function () {

  it('Project.js defaults ui.properties to "properties"', function () {
    const source = fs.readFileSync(path.join(SRC, 'Project.js'), 'utf8')
    const defaultValue = extractMementoDefault(source, 'ui.properties')
    assert.equal(defaultValue, 'properties',
      'Project.js should default ui.properties to "properties" so the panel is open for new projects')
  })

  it('Toolbar.js defaults ui.properties to "properties"', function () {
    const source = fs.readFileSync(path.join(SRC, 'Toolbar.js'), 'utf8')
    const defaultValue = extractMementoDefault(source, 'ui.properties')
    assert.equal(defaultValue, 'properties',
      'Toolbar.js should default ui.properties to "properties" so the toolbar button shows as active')
  })

  it('Project.js and Toolbar.js use the same default', function () {
    const projectSource = fs.readFileSync(path.join(SRC, 'Project.js'), 'utf8')
    const toolbarSource = fs.readFileSync(path.join(SRC, 'Toolbar.js'), 'utf8')
    const projectDefault = extractMementoDefault(projectSource, 'ui.properties')
    const toolbarDefault = extractMementoDefault(toolbarSource, 'ui.properties')
    assert.equal(projectDefault, toolbarDefault,
      'Both components must use the same default value for ui.properties to avoid inconsistency')
  })
})
