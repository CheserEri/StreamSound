# StreamSound Salt UI Compatibility Issues

Date: 2026-07-07

This document records the compatibility issues found after replacing the original UI with Salt UI. It focuses on the StreamSound app, the local Salt UI project dependency, and the backend API contract.

## Summary

The new app and backend are not fully compatible yet. Several issues can break login, registration, token refresh, search, admin functions, favorites/history pages, and cover loading. The Salt UI dependency wiring also likely fails during Gradle configuration.

## Blocking Issues

### ~~1. Login response decoding does not match backend~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/store/AuthStateFlow.kt`
- Backend location: `server/src/routes/auth.ts`
- Current app behavior: decodes `/auth/login` directly as `LoginResponse`.
- Backend behavior: returns `{ data: { accessToken, refreshToken, user } }`.
- Impact: login response deserialization will fail.
- Suggested fix: decode `ApiResponse<LoginResponse>` or change backend to return `LoginResponse` at the top level. Prefer keeping the backend envelope and updating the app for consistency.
- Status: Fixed. The app now decodes `ApiResponse<LoginResponse>`.

### ~~2. Register response decoding does not match backend~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/store/AuthStateFlow.kt`
- Backend location: `server/src/routes/auth.ts`
- Current app behavior: decodes `/auth/register` directly as `RegisterResponse`.
- Backend behavior: returns `{ data: { id, username, role, approved, message } }`.
- Impact: registration will fail to deserialize or lose message data.
- Suggested fix: create a response model matching the backend payload and decode `ApiResponse<...>`.
- Status: Fixed. The app now decodes `ApiResponse<RegisterResponse>` and the model matches the backend registration payload.

### ~~3. UserRole enum casing is incompatible~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/model/Enums.kt`
- Backend locations: `server/src/routes/auth.ts`, `server/src/routes/admin.ts`, `server/src/types/index.ts`
- Current app enum: `USER`, `ADMIN`.
- Backend values: `user`, `admin`.
- Impact: login user and admin user list deserialization will fail even after response envelope fixes.
- Suggested fix: add `@SerialName("user")` and `@SerialName("admin")` to the enum entries, or align backend values to uppercase.
- Status: Fixed. `UserRole` now uses `@SerialName("user")` and `@SerialName("admin")`.

### ~~4. Token refresh response decoding is wrong~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/network/ApiClient.kt`
- Backend location: `server/src/routes/auth.ts`
- Current app behavior: decodes `/auth/refresh` as `LoginResponse`.
- Backend behavior: returns `{ data: { accessToken } }`.
- Impact: refresh will fail and clear auth state.
- Suggested fix: add a `RefreshTokenResponse` model and decode `ApiResponse<RefreshTokenResponse>`. Do not expect `refreshToken` or `user` from this endpoint unless the backend is changed.
- Status: Fixed. Token refresh now decodes `ApiResponse<RefreshTokenResponse>` and reuses the existing refresh token.

### ~~5. Salt UI local project dependency path is inconsistent~~

- StreamSound location: `settings.gradle.kts`
- Salt UI location: `D:/Code/Projects/Salt/SaltUI/ui2/build.gradle.kts`
- Current StreamSound includes: `:salt-ui:ui2` and `:salt-ui:core`.
- Salt UI `ui2` depends on: `project(":core")`.
- Impact: Gradle will likely fail during project configuration because `:core` is not included at the root path expected by Salt UI.
- Suggested fix: either include Salt core as `:core`, or patch the included Salt UI dependency path to `project(":salt-ui:core")`. Avoid editing upstream Salt UI if possible; prefer Gradle include naming that satisfies the local build.
- Status: Fixed. StreamSound now includes Salt core as root project `:core`, matching Salt UI's `project(":core")` dependency.

## API Contract Issues

### ~~6. Search API response envelope is not handled~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/network/SearchApi.kt`
- Backend location: `server/src/routes/search.ts`
- Current app behavior: decodes `/search` directly as `SearchResult`.
- Backend behavior: returns `{ data: { tracks, artists, albums } }`.
- Impact: search page will fail.
- Suggested fix: decode `ApiResponse<SearchResult>`.
- Status: Fixed. Search now decodes `ApiResponse<SearchResult>`.

### ~~7. Search highlight fields do not match~~

- App model: `composeApp/src/commonMain/kotlin/com/streamsound/model/SearchResult.kt`
- Backend location: `server/src/routes/search.ts`
- Current app model fields: `titleHighlight`, `artistHighlight`, `nameHighlight`.
- Backend fields: nested `highlight: { title, artist, album/name }`.
- Impact: highlight data is ignored. With `ignoreUnknownKeys`, this may not crash, but the UI cannot display highlights as intended.
- Suggested fix: either update app models to match nested `highlight`, or flatten backend fields.
- Status: Fixed. Search models now include the backend's nested `highlight` payloads.

### ~~8. Favorites and history decode paginated responses incorrectly~~

- App locations:
  - `composeApp/src/commonMain/kotlin/com/streamsound/network/FavoritesApi.kt`
  - `composeApp/src/commonMain/kotlin/com/streamsound/network/HistoryApi.kt`
- Backend locations:
  - `server/src/routes/favorites.ts`
  - `server/src/routes/history.ts`
- Current app behavior: decodes as `ApiResponse<List<...>>`.
- Backend behavior: returns `{ data: [...], pagination: {...} }`.
- Impact: favorites/history may fail deserialization because `pagination` is not part of `ApiResponse`, depending on generic decode behavior and unknown-key handling.
- Suggested fix: decode `PaginatedResponse<FavoriteTrack>` and `PaginatedResponse<HistoryTrack>`, then return `.data` if the screen only needs the list.
- Status: Fixed. Favorites and history now decode `PaginatedResponse`.

### ~~9. Admin API uses wrong field names for scan path~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/network/AdminApi.kt`
- Backend location: `server/src/routes/admin.ts`
- Current app request: `{ "path": "..." }`.
- Backend expected request: `{ "musicRoot": "..." }`.
- Current app reads music root from: `data["path"]`.
- Backend returns: `data.musicRoot`.
- Impact: admin music root appears empty and scan requests do not use the intended path.
- Suggested fix: use `musicRoot` consistently in request and response models.
- Status: Fixed. Admin scan now sends and reads `musicRoot`.

### ~~10. Admin users response is paginated but app expects ApiResponse~~

- App location: `composeApp/src/commonMain/kotlin/com/streamsound/network/AdminApi.kt`
- Backend location: `server/src/routes/admin.ts`
- Current app behavior: decodes `/admin/users` as `ApiResponse<List<AdminUser>>`.
- Backend behavior: returns `{ data: [...], pagination: {...} }`.
- Impact: same pagination contract mismatch as favorites/history.
- Suggested fix: decode `PaginatedResponse<AdminUser>`.
- Status: Fixed. Admin users now decode `PaginatedResponse<AdminUser>`.

### ~~11. Cover route path does not match backend~~

- App locations:
  - `composeApp/src/commonMain/kotlin/com/streamsound/ui/component/CoverImage.kt`
  - `composeApp/src/androidMain/kotlin/com/streamsound/playback/PlayerConnector.kt`
- Backend location: `server/src/routes/covers.ts`
- Current app route: `/library/tracks/{id}/cover`.
- Backend route: `/covers/:id`.
- Impact: cover images and media metadata artwork return 404.
- Suggested fix: update app URLs to `/covers/{id}` or add a backend alias route.
- Status: Fixed. App cover URLs now use `/covers/{id}`.

## Build And Environment Findings

### ~~12. Server typecheck could not run~~

- Command attempted: `npm run typecheck` in `server`.
- Result: `tsc` was not found.
- Likely cause: dependencies are not installed or `node_modules/.bin` is missing.
- Next step: run `npm install` in `server`, then rerun `npm run typecheck`.
- Status: Fixed. Ran `npm install` in `server`, then `npm run typecheck`; TypeScript typecheck passed.

### 13. App Gradle compile could not run

- Command attempted: `../Salt/SaltUI/gradlew.bat -p D:/Code/Projects/StreamSound :composeApp:compileDebugKotlinAndroid`.
- Result: `JAVA_HOME is not set and no 'java' command could be found in your PATH`.
- Next step: install/configure JDK 17 or 21, set `JAVA_HOME`, then rerun Gradle compile.

### 14. Java target mismatch may need attention

- App location: `composeApp/build.gradle.kts`
- Salt UI location: `D:/Code/Projects/Salt/SaltUI/ui2/build.gradle.kts`
- StreamSound compile options: Java 17.
- Salt UI Android library compiler target: JVM 21.
- Impact: may require a JDK 21 toolchain or aligned Gradle toolchain settings.
- Suggested fix: decide whether the project standard is JDK 17 or 21, then align toolchain and CI/dev setup.

## Notes

- The garbled Chinese seen in some `Get-Content` output appears to be PowerShell console encoding display, not source corruption. `rg` read the same files as UTF-8 and showed the Chinese text correctly.
- Basic Salt UI calls such as `TitleBar`, `Item`, and `Text` appear broadly compatible with the current code usage based on static inspection.
- These findings were produced without modifying application code.
