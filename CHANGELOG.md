# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-01-02

### Fixed
- **Order Calculation**: Resolved a critical bug where adding a payment during order edit caused the "Paid Amount" to double due to a race condition.
- **UI Reliability**: Refactored the Order Details screen to calculate internal totals from payment receipts, ensuring mathematical consistency across devices.
- **Improved Sync**: Stopped redundant state updates in the order creation flow to reduce database write conflicts.
- **Login Robustness**: Refactored environment detection to ensure local Gradle builds default to Staging. Added support for more phone number variants (leading zeros, etc.) to prevent "User not found" errors.

### Added
- **Calendar Enhancements**: Display order counts as color-coded badges (Green/Orange/Red) in the calendar view.
- **Urgency Indicator**: Added a flame icon in calendar badges to highlight dates with urgent orders.
- **Calendar Legend**: Added a new legend to the calendar to explain the load indicators and urgency markers.

## [1.0.4] - 2025-12-29
- Initial public release of the mini-app features.
