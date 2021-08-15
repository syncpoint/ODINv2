/**
 * Command options.
 * @typedef {object} Command~Options
 * @property {string} [description] - descriptive command text.
 * @property {string} [binding] - Mousetrap compatible key binding.
 * @property {function} [body] - Optional function to invoke.
 */

/**
 * @param {object} services - application-level services.
 * @param {...Command~Options} options - command options.
 */
export class Command {
  constructor (options) {
    this.id = options.id
    this.description_ = options.description
    this.binding_ = options.binding
    this.body_ = options.body
  }

  binding () {
    return this.binding_
  }

  description () {
    return this.description_
  }

  invoke () {
    this.body_ && this.body_.apply(this)
  }
}
