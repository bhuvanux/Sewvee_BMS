# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-01-02

### Fixed
- **Order Calculation**: Resolved a critical bug where adding a payment during order edit caused the "Paid Amount" to double due to a race condition.
- **UI Reliability**: Refactored the Order Details screen to calculate internal totals from payment receipts, ensuring mathematical consistency across devices.
- **Improved Sync**: Stopped redundant state updates in the order creation flow to reduce database write conflicts.

## [1.0.4] - 2025-12-29
- Initial public release of the mini-app features.
