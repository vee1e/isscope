Fixes #11

This PR adds comprehensive test coverage for all components within the `src/screens` directory.

### Summary of Changes

- **`LoadingScreen.test.tsx`**: Added tests to verify the rendering of "fetching" and "analyzing" phases. Mocked `useAppStore` to ensure correct rendering of repository metadata (e.g., commit counts, activity metrics) and interaction behaviors like the cancel and refresh buttons.
- **`ReportScreen.test.tsx`**: Implemented tests for the main issue reporting UI. Verified that the screen correctly renders ranked issues, handles issue selection to display detailed views, updates appropriately on search filtering, and triggers markdown export functionality correctly.
- **`HistoryScreen.test.tsx`**: Added test cases for local repository history functionality. Covered history listing, search filtering, viewing detailed repository stats from history, deleting individual entries, and clearing all history with confirmation.
- **`InputScreen.test.tsx`**: Ensured correct validation of GitHub repository inputs (`owner/repo`), submission flow handling, API key configuration toggles, and recent history quick access interactions.
- **`appStore.test.ts`**: Fixed an assertion failure related to configuration bounds testing, ensuring dynamic `CONFIG.MIN_MAX_ISSUES` validation works instead of checking against a hardcoded value.

All 124 tests across 18 files are now passing cleanly with no warnings.
