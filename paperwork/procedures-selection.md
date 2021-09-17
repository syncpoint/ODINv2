## TEST PROCEDURES - SELECTION

### Fixture
1. GROUP/Layers - All (list only)
2. UNIT/4BDE (list/map)
3. UNIT/5BDE (list/map)
4. UNIT/6BDE (list only)
5. UNIT/2 DIV (map only)

### Procedure dae0db2a-2086-4c78-818a-89eb9b81e4a4
Description: Single-select feature on map.
Steps: Deselect all. Select UNIT/4BDE on map.
Expected: UNIT/4BDE is selected on map and in list.
  No other elements are selected either in list or on map.
  UNIT/5BDE and UNIT/2DIV are slightly transparent.
  UNIT/4BDE is only once on the map (verify my moving).

### Procedure b4279bb8-b815-44fb-8a52-9ef7799ad264
Description: Single-select feature in list.
Steps: Deselect all. Select UNIT/5BDE in list.
Expected: UNIT/5BDE is selected on map and in list.
  No other elements are selected either in list or on map.
  UNIT/4BDE and UNIT/2DIV are slightly transparent.
  UNIT/5BDE is only once on the map (verify my moving).

### Procedure 34af21a7-a8c2-4462-8cc0-76b332ade257
Description: Deselect single-selected feature on map.
Reference: dae0db2a-2086-4c78-818a-89eb9b81e4a4
Steps: Toggle selection of selected UNIT/4BDE or deselect all.
Expected: UNIT/4BDE in no longer selected on map and in list.
  No other elements are selected either in list or on map.
  All features on map are displaced with default opaque style.

### Procedure 0dea04ff-d971-4565-a97a-e08ab76a7852
Description: List focus resets map selection.
Steps: With map-selected UNIT/4BDE, change focused element in list.
Expected: No features are selected on map.

### Procedure 33f9e927-9e31-412f-b3b3-330b6cc9751e
Description: Select map exclusive element.
Steps: Deselect all. Select UNIT/2 DIV on map.
Expected: UNIT/4BDE is selected on map.
  No elements are selected in list.

### Procedure 8d0d1259-8f82-4790-9590-e003b440998c
Description: Select on map resets selection in list.
Steps: Select GROUP/Features - All in list. Select UNIT/2 DIV on map.
Expected: UNIT/2 DIV is now selected on map.
  No elements are selected in list.

### Procedure f50ad25f-f2a9-48d1-9177-cf0e688bd225
Description: Replace single selection on map.
Reference: dae0db2a-2086-4c78-818a-89eb9b81e4a4
Steps: While UNIT/4BDE is selected, single-select UNIT/5BDE.
Expected: UNIT/5BDE is now selected in list and on map.
  UNIT/4BDE is no longer selected.

### Procedure 08baaf6c-3db9-4a59-84b3-9207ca82f5fa
Description: Select list exclusive element.
Steps: Deselect all. Select UNIT/6BDE in list.
Expected: UNIT/6BDE is selected in list.
  No features are selected on map.

### Procedure 43b5a9eb-f9f0-4956-a5e7-ebcb46d18967
Description: Deselect in map after select in list.
Steps: Select UNIT/4BDE in list. Click map to deselect all.
Expected: No elements are selected either in list not on map.

### Procedure 3deb3820-7b97-45eb-a5ce-e14b447298ef
Description: Selection is kept after rename.
Steps: Select UNIT/5DBE. Rename UNIT/5DBE.
Expected: Feature is still selected in map and in list.
  Name is updated in list and on map.

### Procedure 2a080b85-8da4-42ce-b02a-cf083fddaca5
Description: Selection is kept after move.
Steps: Select UNIT/5DBE. Move feature on map.
Expected: UNIT/5DBE is still selected on map and in list.
  UNIT/5DBE has correct position on map.
  Verify selection is still active by moving a second time.

### Procedure d900e623-5674-4841-971a-1dfb23948cce
Description: Box-select on map should reset list selection.
Steps: Select GROUP/Layers - All in list. Box-select UNIT/4BDE.
Expected: GROUP/Layers - All is not selected in list.
  UNIT/4BDE is selected on map.
  No other elements are selected either in list or on map.
