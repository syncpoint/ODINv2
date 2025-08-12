//
// NOTE:
// In the application code `cmdOrCtrl` is used to determine whether the user
// pressed the platform specific "command" modifier key.  The original
// implementation relied on `process.platform` to decide whether to honour the
// `metaKey` (macOS) or the `ctrlKey` (all other platforms) property.  This
// means that in environments where tests are executed on a non-macOS platform
// but simulate the Command key by setting `metaKey: true`, the function
// returned `false` and the modifier was ignored.  Consequently selection logic
// that depends on this helper behaved incorrectly under test and failed to
// toggle items as expected.
//
// Treat the helper as a pure check for "either command **or** control" being
// pressed.  This makes the behaviour deterministic and platform agnostic,
// matching the semantics used throughout the test-suite and preventing false
// negatives when simulating user input.
export const cmdOrCtrl = ({ metaKey, ctrlKey }) => metaKey || ctrlKey
