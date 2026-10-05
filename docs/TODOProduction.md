# Production TODO

- [ ] Before broadly promoting Instant Booking, implement real host availability
      management (external calendar synchronization) and
      preparation/advance-notice controls. Confirmed bookings made here already
      receive transactional overlap protection; the host calendar now manages real
      manual blocked nights. Monitor instant notices in the Resend component and through
      Resend delivery webhooks.

- [ ] Replace the broad confirmed-booking overlap scan with an occupancy/index design
      before very high booking volume per listing. The current guard fails safely
      above 1,000 future candidates; it is a read budget, not a storage quota.
      Calendar queries share that guard and must never display a truncated read as
      complete availability.

- [ ] Design and implement host cancellation consequences before enabling them: distinguish avoidable cancellations from verified emergencies, define notice-based fees or other consequences, review repeated cancellations, and provide an exemption/appeal process. No host cancellation penalties apply in the current planned version. Preserve cancellation actor, reason, timestamp, and emergency case history to support future review. See [CancellationPolicySystemDesign.md](./CancellationPolicySystemDesign.md).

- [ ] Create a **JavaScript Map ID** in the project's Google Cloud Console under **Google Maps Platform → Map Management → Create map ID**. The existing Maps API key is separate from the Map ID. [Google's instructions](https://developers.google.com/maps/documentation/javascript/map-ids/get-map-id)
- [ ] Set `PUBLIC_GOOGLE_MAPS_MAP_ID` to that ID in the production environment. The app currently falls back to `DEMO_MAP_ID`, which Google provides for testing and should be replaced for production. Keep `PUBLIC_GOOGLE_MAPS_API_KEY` configured as the API key.

- [ ] Verify request, guest confirmation, guest expiration and cancellation inbox delivery using the registered
      `@convex-dev/resend` component, verified sending domain, `RESEND_API_KEY` and
      `EMAIL_FROM`. Monitor failures in the `resend` component's `emails` table in Convex Dashboard.
      The component owns batching, rate limits and retries (defaults: five total
      attempts, 30-second initial exponential backoff). Request, confirmation and
      expiration email records live in the component; cancellation notices still
      retain `cancellation.emailIds`. `sent` means provider
      acceptance, not inbox delivery. Historical bookings are not emailed retroactively.
      Request receipts remain separate from future host-confirmation emails.
- [ ] Register the production Resend webhook at
      `https://<production-deployment>.convex.site/resend-webhook`, enable all
      outgoing `email.*` events, and set `RESEND_WEBHOOK_SECRET` in that Convex
      deployment. The endpoint verifies signatures through the component. Verify
      delivered/bounced updates and alert/recovery handling for failed sends.
- [ ] Define Resend component email/content retention before production launch.
      Cleanup removes historical status and enqueue idempotency keys; preserve
      needed cancellation email references and avoid replaying old notification events.

- [ ] Before deploying the tightened booking schema to an existing production
      database, temporarily retain the four retired top-level email ID fields as
      optional. Deploy the new writers and `removeBookingEmailIds`, run that
      migration to completion, then remove the optional fields. The migration
      preserves booking history and component email records and sends no notices.
      Development cleanup is complete.

- [ ] Before production rollout, review existing pending-request contact data:
      `expireBookingRequestsCron` initializes legacy deadlines and expires/notifies
      overdue requests automatically. Verify the five-minute cron is running and
      monitor failed batches and expiration delivery in the Resend component. Confirmed
      bookings are unaffected. See [request expiration](./CancellationPolicySystemDesign.md#unanswered-request-expiration).
