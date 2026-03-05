# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- [FEATURE] F-001: Authentication & User Profile
- [FEATURE] F-002: Restaurant & Menu Management
- [FEATURE] F-003: Order Session Lifecycle
- [FEATURE] F-004: Voting System
- [FEATURE] F-005: Order Items & Topping Selection
- [FEATURE] F-006: Bill Splitting & Calculation
- [FEATURE] F-007: VietQR Payment Tracking

### Fixed
- [BUG] BUG-01: Fixed database error "Database error saving new user" during new user OAuth signup by dropping the `on_auth_user_created` trigger which was installed by the Supabase starter template and conflicted with the Next.js custom `users` schema.
- [BUG] BUG-02: Fixed `getaddrinfo ENOTFOUND` error during Postgres client connection by URL-encoding special characters (like `?`) in the `.env.local` `DATABASE_URL` password, ensuring the hostname parses correctly.
- [BUG] BUG-03: Fixed "invalid input syntax for type uuid: 'new'" Postgres error by implementing the missing `/sessions/new` page and adding strict UUID regex validation to dynamic `[sessionId]` routes.
- [BUG] BUG-04: Fixed "Failed query: select ... from restaurants" server crash on `/sessions/new` by correcting malformed Drizzle ORM `where()` clauses to safely use `eq()` and `or()` operators.
