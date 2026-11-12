# Verification record

## Known issues take precedence over mock results

The user reports that the web Codex integration shows intermediate JSON instead of readable AI streaming and that tasks fail because of permissions. Only Codex was checked; other providers were unavailable. This report was documented without investigation or a fix. Earlier automated tests and limited provider checks do not prove live web workflows work. Use the [CLI guide](../../docs/CLI_GUIDE.md) and consult [known issues](../../docs/KNOWN_ISSUES.md).

## Earlier automated verification

The customization framework was checked on Linux on 2026-11-12.

- Application tests use synthetic temporary projects, including permission checks, conflicts, staging/import, legacy batches, profile validation, stale requests, recovery guards and a one-lesson/30-minute generation-to-completion flow.
- Batch validator coverage includes 1, 6 and 40 lessons, optional reviews, custom timing, missing sessions and malformed activity tables.
- TypeScript and ESLint checks passed.
- Production build passed. Vite reports a large main chunk and non-fatal dependency annotation warnings.
- Three Chromium browser journeys passed: study/progress/notes/AI events; mobile navigation and Markdown sanitation; fresh onboarding, saved customization and transition to strategy generation. Desktop/mobile customization screenshots were visually inspected.
- Project validation passed for the reset framework. No real lessons or reviews are generated; cycle validation runs against synthetic fixtures.

## Unverified boundaries

Live AI curriculum/lesson generation was not executed for this change. Provider integrations require installed, authenticated tools; lifecycle checks use mocks. External educational sources were not researched or verified, and the reset catalog contains no assigned sources. Content quality, proficiency assessment and other-language teaching quality require review of actual generated material. macOS/Windows were not tested.

## Current scope

One learner per project folder. New curriculum generation and lesson batches are staged and reviewed. Existing strategy revisions and historical-record corrections remain explicit terminal workflows. The application is localhost-only and has no multi-user accounts. Personal artifacts were removed with explicit user authorization; no backup was retained.
