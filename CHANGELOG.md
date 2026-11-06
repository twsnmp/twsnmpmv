# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-11-07

### Added
- **TWSNMP NEO Support**: Added full support for fetching and displaying report views from TWSNMP NEO instances.
- **Playwright E2E Testing & Screen Recording**: Migrated the end-to-end testing and video recording pipeline from Maestro to Playwright, enabling automated tests and mobile screen recordings on Mobile Chrome and Mobile Safari.
- **Enhanced Map Settings**: Improved map configuration options based on twsnmpfk, including enhanced support for MapLibre GL v6 raster/vector tile layers.
- **UI Mode & Tasks in mise**: Added `e2e:test`, `e2e:ui`, and `e2e:record` tasks to `mise.toml`.

### Changed
- **Svelte 5 & Vite 8 Upgrade**: Migrated the application to Svelte 5 (using `mount()`) and upgraded build tooling to Vite 8.3.6 with `@sveltejs/vite-plugin-svelte` 7.3.1.
- **Component Refactoring**: Replaced Flowbite dependencies with pure, lightweight Tailwind UI components.
- **Terminology Update**: Renamed "AI Analysis" to "Anomaly Detection" (異常検知) for consistency across TWSNMP FC and TWSNMP NEO.
- **iOS Deployment Target**: Updated iOS deployment target to 15.0.

### Fixed
- Fixed duplicated vertical scrollbars on tables with scrollable contents.
- Fixed Dropdown toggle behavior and removed invalid button nesting in BottomNavItem.
- Updated security-related dependencies (postcss, undici, capacitor, maplibre-gl).

---

## [2.0.0] - 2026-05-15

### Added
- **Environmental Monitoring Enhancements**: Added RSSI time-series charting, dynamic table integration, filtering out 0-value data, and improved mobile tab navigation.
- **Direct Report Navigation**: Organized bottom navigation bar to allow directly opening each report screen from the map.
- **Automated Release Workflow**: Added GitHub Actions workflow to build and attach signed release APKs on new tag pushes.
- **Automated Version Management**: Integrated `capacitor-set-version` with `mise.toml` to synchronize version and build numbers across Android and iOS projects.

### Changed
- Standardized modal layouts with uniform headers and close buttons; simplified deletion confirmation flows.

### Fixed
- Fixed node display and image icon rendering bugs on initial load.
- Resolved build and packaging issues for Android and iOS release targets.

---

## [1.0.0] - 2024-01-08

### Added
- Initial release of TWSNMP Map Viewer (`twsnmpmv`).
- Multi-site monitoring for TWSNMP networks.
- Interactive network map rendering with p5.js (nodes, lines, status indicators).
- Real-time status polling and color-coded status visualization.
- Cross-platform support for iOS and Android using Capacitor.
