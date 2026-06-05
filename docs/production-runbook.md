# Production Runbook

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm these tables exist:
   - `app_users`
   - `buyer_profiles`
   - `creator_profiles`
   - `projects`
   - `project_matches`
   - `orders`
   - `messages`
   - `reviews`
   - `activity_events`
   - `abuse_reports`
5. Confirm these Storage buckets exist:
   - `public-assets`
   - `private-verifications`

Do not run `supabase/seed.sql` in production unless you intentionally want demo data.

## 2. Vercel

1. Import this repository into Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Add environment variables from `.env.production.example`.

Required variables:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_INVITE_CODE=
```

Generate a strong `ADMIN_INVITE_CODE`. Do not use the local demo invite code in production.

## 3. Free Pilot Mode

The first launch is free:

- Free buyer onboarding.
- Free creator onboarding.
- Free project posting.
- Project `budget` is an intent budget for matching and communication only.
- No online payment, escrow, settlement, delivery acceptance, or platform commission.

Payment variables are optional during this stage.

## 4. Predeploy Check

Run before deploying. First verify the production environment variables you plan to use:

```bash
npm run check:env
```

Then run the full local predeploy check:

```bash
npm run check:predeploy
```

`check:env` verifies required production variables, HTTPS app URL, and admin invite code strength. `check:predeploy` verifies required files, lint, TypeScript, and production build.

## 5. Postdeploy Check

After Vercel deployment, set `NEXT_PUBLIC_APP_URL` to the production URL and run:

```bash
npm run check:prod
```

Then confirm the first public marketplace view is not empty:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.example npm run check:pilot
```

Or open:

```text
https://your-domain.example/api/health
```

The response should include:

```json
{
  "ok": true,
  "data": {
    "ok": true
  }
}
```

`check:prod` verifies environment, data access, storage, upload limits, and optional integrations. `check:pilot` verifies public supply and demand, including open project demands, training demands, approved service providers, approved training providers, and recommended matches.

## 6. Manual Smoke Test

1. Register a buyer.
2. Complete the subject profile.
3. Register an admin with `ADMIN_INVITE_CODE`.
4. Approve the buyer profile in admin.
5. Post a free project.
6. Approve the project in admin.
7. Register a creator.
8. Complete creator profile.
9. Approve creator profile in admin.
10. Creator opens public projects and expresses interest.
11. Buyer sees the lead in `/buyer`.
12. Publish a training demand from a buyer account.
13. Complete a training provider profile.
14. Confirm the training provider appears in `/creators`.
15. Submit a trial feedback item from the feedback widget.
16. Admin sees activity, lead, feedback, and report metrics.

## 7. Rollback

If a deployment is bad:

1. In Vercel, open Deployments.
2. Select the previous successful deployment.
3. Click Promote to Production.
4. Re-run `npm run check:prod`.

## 8. Production Operating Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Keep `ADMIN_INVITE_CODE` private and rotate it after staff changes.
- Review new buyer profiles and projects before making them public.
- Review creator profiles before allowing active outreach.
- Handle reports from the admin report queue.
- Keep legal pages aligned with the actual operating entity.
