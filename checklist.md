# Implementation Checklist — Mini Calls & Texts v1

Implementation branch: `feat/complete-v1-backend`
Source of truth: `plan.md`, `Todo.md`, and `AGENTS.md`

> Check items only after implementation and relevant verification. Production/account tasks stay unchecked until verified in the real services.

## 1. Project foundation
- [x] Confirm Node 22.11+ runtime, package scripts/dependencies, and Railway build/start configuration
- [x] Validate production environment variables and fail safely on missing configuration
- [x] Add shared Prisma client and graceful process shutdown
- [x] Keep secrets and local artifacts excluded from Git

## 2. Data layer
- [x] Finalize Contact, Call, and Message models, direction enums, indexes, and uniqueness constraints
- [x] Add initial Prisma migration and migration lock file
- [x] Add database readiness check and shared connection lifecycle

## 3. Core API and security
- [x] Implement liveness and database-readiness endpoints
- [x] Require a configured API key using constant-time comparison
- [x] Validate request payloads and international E.164 phone numbers
- [x] Add bounded history queries and safe message-thread lookup
- [x] Add outbound call/SMS rate limits
- [x] Add consistent error handling and redacted structured logging

## 4. Outbound calls
- [x] Persist a queued call before contacting Twilio
- [x] Start Twilio calls with dedicated outbound TwiML and a bridge destination
- [x] Persist Twilio SID and provider status
- [x] Mark provider failures safely and return actionable API errors
- [x] Expose recent call history

## 5. Inbound calls and call status
- [x] Validate Twilio signatures against the configured public webhook URL
- [x] Persist inbound calls idempotently and normalize phone numbers
- [x] Return forwarding/rejection TwiML
- [x] Handle call status/action callbacks and timestamps safely
- [x] Document Twilio Console webhook configuration

## 6. Outbound SMS
- [x] Persist queued messages before sending
- [x] Send SMS through Twilio with delivery callbacks
- [x] Persist provider SID/status and mark failed sends safely
- [x] Expose recent messages and per-number threads

## 7. Inbound SMS and delivery status
- [x] Validate inbound SMS webhook signatures and account SID
- [x] Validate payload/phone fields and persist inbound messages idempotently
- [x] Acknowledge valid webhooks with TwiML
- [x] Handle delivery status callbacks idempotently

## 8. Tests and quality
- [x] Replace placeholder tests with meaningful unit/API tests
- [x] Cover phone normalization, payload validation, API auth, production config, Twilio signatures, and status updates
- [x] Cover call/SMS success/failure, inbound persistence, and rate limits with mocked providers
- [x] Run Prisma validation, client generation, and migration against PostgreSQL
- [x] Context7 review: Twilio Node SDK `validateRequest`, Express 4 middleware/error-handling behavior, and Prisma production migration workflow
- [x] Add CI workflow for install, audit, migrations, and tests

## 9. Documentation and deployment readiness
- [x] Update README with setup, API examples, environment variables, and Twilio configuration
- [x] Document Railway build/start/migration procedure and health checks
- [x] Document frontend API contract, error responses, and API-key secrecy
- [x] Update `plan.md` to match the implemented call bridge and routes
- [x] Link `Todo.md` to this progress checklist
- [x] Verify backend v1 work that can be tested without production credentials
- [x] Fix Express 4 readiness handler so PostgreSQL failures return HTTP 503
- [x] Add tests for readiness success and database failure

## 10. External actions requiring account access
- [ ] Confirm the correct Railway account/workspace and Mini Calls & Texts project. The connected Railway account currently shows no matching project, so no existing service was changed.
- [ ] Confirm whether this is an existing Railway service or a new one. Railway Config as Code (`railway.json`) is deprecated: existing services can use it only until 2026-12-01, and new services must use Infrastructure as Code or dashboard settings.
- [ ] Confirm Railway PostgreSQL service and production environment variables
- [ ] Apply the migration to the production database
- [ ] Deploy to Railway and verify the live readiness endpoint
- [ ] Configure the Twilio number's inbound voice and SMS webhook URLs
- [ ] Perform real inbound/outbound call and SMS tests
- [ ] Connect the actual frontend and verify end-to-end flows

## Post-v1 maintenance follow-ups (not required for initial feature acceptance)
- [ ] Generate and commit `package-lock.json` from a registry-enabled environment; switch CI and deployment installs to `npm ci`.
- [ ] Plan and test separate major-version migrations for Express 5 and Prisma 7 before upgrading; current implementation targets Express 4 and Prisma 6.

## Progress log
- 2026-11-13 — Inspected repository. The task list is `Todo.md` (capital T); source scaffold and placeholder tests were present.
- 2026-11-13 — Implemented the v1 backend, schema/migration, Twilio webhooks, security, tests, CI, Railway configuration, README, and plan updates on `feat/complete-v1-backend`.
- 2026-11-13 — Final automated CI passed: 27 tests, 0 failures; PostgreSQL migration applied successfully; Prisma validation and generation passed; dependency audit reported 0 vulnerabilities.
- 2026-11-13 — Verified the connected Railway account has no Mini Calls & Texts project. No production deployment or existing Railway service was changed.
- 2026-11-13 — GitGuardian initially flagged a test-only CI password. The workflow now uses a per-run value and the feature branch history was cleaned; GitGuardian reports no secrets detected.
- 2026-11-13 — PR #1 merged to `main` (merge commit `f634e841ce04e6f7cbc31c2904f6213179286a7c`).
- 2026-11-13 — Context7 review confirmed the implementation uses supported Twilio Node `validateRequest` APIs; custom validation uses the configured public URL and account SID check. Express 4 docs highlighted async error handling: readiness handler now catches database errors and returns 503, with regression tests.
- 2026-11-13 — Railway docs confirm Config as Code is deprecated; new services cannot use `railway.json`, with hard cutoff 2026-12-01 for existing services. README now documents dashboard settings or migration to `.railway/railway.ts` IaC.
- 2026-11-13 — Follow-up branch `fix/readiness-check-and-railway-docs` contains the readiness fix, regression tests, and documentation updates.
- 2026-11-13 — Follow-up CI passed: 29 tests, 0 failures; PostgreSQL migration applied; Prisma validation/generation passed; npm audit reported 0 vulnerabilities; GitGuardian scan passed.
- 2026-11-13 — Runtime audit found Node 20 reached end-of-life on 2026-04-30. Updated the project engine constraint and CI to Node 22 (Prisma 6 minimum Node 22.11); final verification on the updated runtime is pending.
