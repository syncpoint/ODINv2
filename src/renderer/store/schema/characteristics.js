/**
 * Although schema-less by default, we have a few options of how data is
 * organized in tuple store. Over time, some initial decisions were changed
 * and upgrades to the current schema were necessary.
 *
 * While schema upgrades are the important part, in rare cases downgrades
 * might be necessary, when switching versions in development while keeping
 * the same database instances.
 *
 * Instead of maintaining a single database schema version, we define a set of
 * schema characteristics which may be upgraded (or downgraded) individually.
 *
 * All upgrades are inverse to their respective downgrades.
 * Updates (and downgrades) are idempotent when its characteristic is already
 * enabled or disabled.
 */

/**
 * Initially we stored ids not only in keys but often also redundantly in values.
 * It was convenient at first, but pretty soon it became just confusing.
 * The current approach is to store ids ONLY in keys and NEVER in values.
 */
export const REDUNDANT_IDENTIFIERS = 'redundantIdentifiers' // KEY-ONLY | VALUE

export const INLINE_TAGS = 'inlineTags' // TODO: tags : INLINE | SEPARATE
export const INLINE_FLAGS = 'inlineFlags' // TODO: flags : INLINE | SEPARATE
export const DEFAULT_TAG = 'defaultTag' // TODO: default-tag : INLINE | SEPARATE
export const INLINE_STYLES = 'inlineStyles' // TODO: styles: INLINE | SEPARATE
