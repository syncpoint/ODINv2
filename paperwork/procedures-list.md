## TEST PROCEDURES - LIST

### Fixture
List with enough options to fill two or more 'pages.'

### Reference
https://www.w3.org/TR/wai-aria-practices-1.1/#listbox_kbd_interaction

### Procedure 843e959e-8ba2-4959-bccb-0e26031c56db
Description: No initial focus without selection.
  NOTE: Different from WAI-ARIA Listbox.
Steps: Deselect all. Refresh list.
Expected: No option has focus.
  No option is selected.

### Procedure b832aec5-3132-4f2b-885b-3f49dae9a496
Description: Initial focus with selection.
Steps: Select options 2 and 3. Refresh list.
Expected: Option 2 has focus (first selected option).
  Options 2 and 3 are selected.

### Procedure 4e251436-5227-4acb-9b5b-6c16ca708091
Description: Move focus to next option.
Steps: Focus option 2. 1 x <ArrowDown>.
Expected: Option 3 now has focus.

### Procedure cdf63d48-f48d-4802-afd4-020d69a5fcf2
Description: Move focus to previous option.
Steps: Focus option 3. 1 x <ArrowUp>.
Expected: Option 2 now has focus.

### Procedure 293bee63-45cf-449d-aaec-9efe169c8499
Description: Focus does not cycle (forwards).
Steps: Focus last option. 1 x <ArrowDown>.
Expected: Last option still has focus.

### Procedure a13ee2ab-e3d7-48e1-8c4b-7d588c9e2f2b
Description: Focus does not cycle (backwards).
Steps: Focus first option. 1 x <ArrowUp>.
Expected: First option still has focus.

### Procedure df68029a-09a1-4c50-bb47-b3c0bc5aa10d
Description: Focus after block selection (shift-click).
Steps: Focus a option. Scroll down a page or two.
  Shift-click another option.
Expected: Last selected option has focus.

### Procedure e143923d-c1c6-46f3-a0e6-6cb62e3fc0e9
Description: Shift-click extends selection (same direction).
Steps: Focus first option. Shift-click option 3.
  Shift-click option 5.
Expected: Option 1 through 5 are selected.

### Procedure 00b5e018-72d5-4377-ba53-236028e3858c
Description: Shift-click inverts selection (opposite direction).
Steps: Focus option 5. Shift-click option 7.
  Shift-click option 3.
Expected: Options 3 through 5 are selected.
