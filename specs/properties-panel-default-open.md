# Properties Panel Default: Open on Selection

## Overview

When a new project is created in ODIN, the properties panel should be open by
default. This means that selecting a feature or layer on the map will
immediately show its properties in the side panel. Users can toggle the panel
off if they prefer a cleaner workspace.

## Background

The properties panel visibility is controlled by the `ui.properties`
preference, persisted via `useMemento`. The possible values are:

| Value | Effect |
|-------|--------|
| `''` (empty string) | No panel shown |
| `'properties'` | Properties panel shown |
| `'styles'` | Styles panel shown |
| `'sharing'` | Sharing panel shown |

The default value (used when no preference has been stored yet, i.e. in a new
project) was `''`, meaning the panel is closed. This is confusing for new users
who expect to see properties when selecting items on the map.

## Change

Set the default value of `ui.properties` from `''` to `'properties'` in both
components that consume this preference:

- `src/renderer/components/Project.js` — renders the panel conditionally
- `src/renderer/components/Toolbar.js` — toggles the panel and shows the
  active state of the toolbar button

This only affects **new projects** (or projects where the user has never
toggled the panel). Existing projects retain their stored preference.

## Acceptance Criteria

1. In a newly created project, the properties panel is visible by default
   (equivalent to `ui.properties === 'properties'`).
2. Selecting a feature on the map shows its properties immediately without
   having to click the properties toolbar button first.
3. Users can close the panel by clicking the properties toolbar button; the
   preference is persisted and the panel remains closed on next open.
4. Users can re-open the panel by clicking the toolbar button again.
5. Existing projects with a stored `ui.properties` value are not affected.
6. The properties toolbar button shows as active/checked in new projects.
