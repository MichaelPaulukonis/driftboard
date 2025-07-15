# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Created a new, foundational End-to-End (E2E) test, `test_user.basics.spec.ts`, which uses a persistent, seeded user to validate core application flows.
- Implemented a robust Playwright authentication strategy using a global setup file to create ephemeral users for CI/CD test runs, ensuring a clean state for each run.

### Changed
- Overhauled the E2E testing suite by backing up old, failing tests and starting with a clean, scalable structure.
- Updated project documentation, including plans for data versioning, integration testing, and DND fixes, to reflect their completed status.

### Fixed
- Restored drag-and-drop (DND) functionality for both cards and lists. This involved correcting the database schema's foreign key relationships for versioning, fixing backend logic for moves and updates, and refactoring the frontend DND handling to use correct persistent identifiers.
- Replaced all incorrect `authorId` references with the correct `userId` field across the backend API and integration tests, resolving a critical data consistency issue.
- Resolved a fundamental conflict between the database migration history and the Prisma schema that prevented the development database from being created and seeded correctly.
- Corrected a `TypeError` in the test runner caused by a configuration mismatch between Playwright and Vitest.

### Chore
- Reset the database migration history to establish a new, clean state based on the current, correct schema.