# Changelog

All notable changes to StreamSound are documented in this file.

## [0.1.0-alpha.4] - 2026-04-29

### Fixed
- Fixed Android native component registration by aligning `MainActivity` with the JavaScript app name `StreamSound`.
- Fixed Metro release bundle setup by declaring `@react-native/metro-config`.
- Reduced misleading `AppRegistry` startup errors by delaying the root `App` import until registration.
- Made React Native Track Player setup idempotent to avoid duplicate native player initialization.

### Changed
- Added `bundle:android` verification script for Android release JavaScript bundle checks.

## [0.1.0-alpha.3] - 2026-04-29

### Fixed
- Fixed Android APK startup failure caused by missing bundled JavaScript assets when the app is opened without Metro.
- Fixed frontend TypeScript errors for navigation types, slider dependency, and react-native-track-player v4 exports/events.
- Fixed server production startup by copying `src/db/schema.sql` into `dist/db/schema.sql` during build.
- Fixed boolean environment parsing so values such as `SCAN_ON_START=false` are handled correctly.

### Changed
- Added explicit Android packaging scripts: `apk:debug`, `apk:release`, and `android:release`.
- Bumped app and server package versions to `0.1.0-alpha.3`.
