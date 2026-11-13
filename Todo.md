# Todo — Mini Calls & Texts Backend

The implementation status is tracked in [checklist.md](./checklist.md). Keep this file as the original v1 build-order reference; only mark an item complete in the checklist after its implementation and verification have passed.

## Build order

1. Initialize the Node.js project.
2. Install Express, Prisma, Twilio, Zod, and dotenv.
3. Create the PostgreSQL database on Railway.
4. Set environment variables in Railway.
5. Create the Prisma schema.
6. Run the first database migration.
7. Build the health endpoint.
8. Build the outbound SMS endpoint.
9. Build the inbound SMS webhook.
10. Build the outbound call endpoint.
11. Build the inbound voice webhook.
12. Build the call-status webhook.
13. Build the message-status webhook.
14. Add API-key middleware.
15. Add Twilio signature validation.
16. Add logging and error handling.
17. Deploy to Railway.
18. Configure Twilio webhook URLs.
19. Test calls and texts.
20. Connect the frontend.
