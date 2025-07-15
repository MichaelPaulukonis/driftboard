# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Restored drag-and-drop (DND) functionality for both cards and lists. This involved correcting the database schema's foreign key relationships for versioning, fixing backend logic for moves and updates, and refactoring the frontend DND handling to use correct persistent identifiers.
- Replaced all incorrect `authorId` references with the correct `userId` field across the backend API and integration tests, resolving a critical data consistency issue.
- Resolved a fundamental conflict between the database migration history and the Prisma schema that prevented the development database from being created and seeded correctly.

### Chore
- Reset the database migration history to establish a new, clean state based on the current, correct schema.