# Implementation Checklist — Mini Calls & Texts v1

Branch: `feat/complete-v1-backend`
Source of truth: `plan.md`, `Todo.md`, and `AGENTS.md`

> Items are checked only after implementation and the relevant verification have succeeded. External account/deployment steps are tracked separately and will not be marked complete without access and evidence.

## 1. Project foundation
- [ ] Confirm runtime, package scripts, dependencies, and Railway start/build configuration
- [ ] Validate required environment variables and fail safely on missing production configuration
- [ ] Add a shared Prisma client and graceful process shutdown
- [ ] Ensure secrets and local artifacts remain excluded from Git

## 2. Data layer
- [ ] Finalize Contact, Call, and Message models, enums, indexes, and uniqueness constraints
- [ ] Add an initial Prisma migration and migration lock file
- [ ] Add database readiness check and safe connection lifecycle

## 3. Core API and security
- [ ] Implement health/readiness endpoint
- [ ] Require a configured API key using constant-time comparison
- [ ] Validate request payloads and E.164 phone numbers
- [ ] Add bounded pagination and safe message-thread lookup
- [ ] Add outbound call/SMS rate limits
- [ ] Add consistent error handling and redacted structured logging

## 4. Outbound calls
- [ ] Create a pending call record before contacting Twilio
- [ ] Start the Twilio call with a dedicated outbound TwiML URL
- [ ] Persist Twilio SID and status
- [ ] Mark failed attempts safely and return an actionable API error
- [ ] Expose recent call history

## 5. Inbound calls and call status
- [ ] Validate every Twilio webhook signature using the public webhook URL
- [ ] Persist inbound calls idempotently
- [ ] Return valid forwarding/rejection TwiML
- [ ] Handle call status callbacks, timestamps, and unknown SIDs safely
- [ ] Document Twilio Console webhook configuration

## 6. Outbound SMS
- [ ] Create queued message record before sending
- [ ] Send SMS through Twilio with delivery callback
- [ ] Persist SID/status and mark failed sends safely
- [ ] Expose recent messages and per-number threads

## 7. Inbound SMS and delivery status
- [ ] Validate inbound SMS webhook signatures
- [ ] Validate payload/account/phone fields and persist inbound messages idempotently
- [ ] Acknowledge valid webhooks promptly
- [ ] Handle delivery status callbacks and timestamps idempotently

## 8. Tests and quality
- [ ] Replace placeholder tests with meaningful unit/API tests
- [ ] Cover phone normalization, validation, authentication, Twilio signatures, and status mapping
- [ ] Cover call and SMS success/failure paths with mocked external services
- [ ] Run test suite and Prisma validation/generation
- [ ] Add CI workflow for install, Prisma validation, and tests

## 9. Documentation and deployment readiness
- [ ] Update README with setup, API examples, environment variables, and Twilio configuration
- [ ] Document Railway build/start/migration procedure and health checks
- [ ] Document frontend API contract and error responses
- [ ] Verify all v1 definition-of-done items that can be verified without production credentials

## 10. External actions requiring account access
- [ ] Confirm Railway PostgreSQL service and production environment variables
- [ ] Apply production database migration
- [ ] Deploy the service to Railway and verify health
- [ ] Configure Twilio number webhooks to the deployed HTTPS URLs
- [ ] Perform real inbound/outbound call and SMS tests
- [ ] Connect the frontend and verify end-to-end flows

## Progress log
- Started: 2026-11-13
- Initial inspection: existing source scaffold found; test files are placeholders; `Todo.md` exists with uppercase T.
- No implementation item is marked complete until verified.
