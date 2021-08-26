import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { isGroupId, isFeatureId } from '../ids'

const taggable = id => !isGroupId(id)

const addtag_ = name => item => {
  item.tags = R.uniq([...(item.tags || []), name])
}

const removetag_ = name => item => {
  (item.tags = (item.tags || []).filter(tag => tag !== name))
}

/**
 *
 */
const addTag = function (ids, name) {
  return {
    apply: async () => {
      const items = await this.valuesById_(ids)
      const ops = items
        .map(R.tap(addtag_(name)))
        .reduce((acc, item) => acc.concat({ type: 'put', key: item.id, value: item }), [])
      this.level_.batch(ops)
    },
    inverse: () => this.commands_.removeTag(ids, name)
  }
}


/**
 *
 */
const removeTag = function (ids, name) {
  return {
    apply: async () => {
      const items = await this.valuesById_(ids)
      const ops = items
        .map(R.tap(removetag_(name)))
        .reduce((acc, item) => acc.concat({ type: 'put', key: item.id, value: item }), [])
      this.level_.batch(ops)
    },
    inverse: () => this.commands_.addTag(ids, name)
  }
}

/**
 *
 */
const updateProperties = function (oldProperties, newProperties) {
  return {
    apply: () => this.level_.batch([{
      type: 'put',
      key: newProperties.id,
      value: newProperties
    }]),
    inverse: () => this.commands_.updateProperties(newProperties, oldProperties)
  }
}


/**
 * @constructor
 * @param {LevelUp} propertiesLevel properties database.
 */
export function PropertiesStore (propertiesLevel, selection, undo) {
  Emitter.call(this)

  this.level_ = propertiesLevel
  this.selection_ = selection
  this.undo_ = undo

  this.commands_ = {}
  this.commands_.addTag = addTag.bind(this)
  this.commands_.removeTag = removeTag.bind(this)
  this.commands_.updateProperties = updateProperties.bind(this)
}

util.inherits(PropertiesStore, Emitter)


/**
 *
 */
PropertiesStore.prototype.valuesById_ = function (ids) {
  return ids.reduce(async (acc, id) => {
    (await acc).push(await this.level_.get(id))
    return acc
  }, [])
}

/**
 *
 */
PropertiesStore.prototype.addTag = function (id, name) {
  // TODO: special handling - default layer
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const command = this.commands_.addTag(ids, name)
  this.undo_.apply(command)
}

/**
 *
 */
PropertiesStore.prototype.removeTag = function (id, name) {
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const command = this.commands_.removeTag(ids, name)
  this.undo_.apply(command)
}

PropertiesStore.prototype.rename = async function (id, value) {
  const oldProperties = await this.level_.get(id)
  const newProperties = { ...oldProperties, name: value }
  const command = this.commands_.updateProperties(oldProperties, newProperties)
  this.undo_.apply(command)
}
