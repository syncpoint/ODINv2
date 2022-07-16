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
    this.options = options
    this.id = options.id
  }

  description () {
    return this.options.description
  }

  invoke (dryRun) {
    this.options.body && this.options.body(dryRun)
  }

  revert () {
    this.options.revert && this.options.revert()
  }
}
