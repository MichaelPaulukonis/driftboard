# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Resolved a fundamental conflict between the database migration history and the Prisma schema that prevented the development database from being created and seeded correctly.

### Chore
- Reset the database migration history to establish a new, clean state based on the current, correct schema.
