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
DEEPSEEK_API_KEY=
```

Generate a strong `ADMIN_INVITE_CODE`. Do not use the local demo invite code in production.

AI story generation may also use one of these alternatives instead of `DEEPSEEK_API_KEY`:

- `CODEX_API_KEY`
- `OPENAI_API_KEY`

If you use OpenAI/Codex, also set the matching model variable:

- `CODEX_MODEL` or `OPENAI_MODEL`

In Supabase Auth, also confirm:

- Email provider is enabled.
- Redirect URLs include `https://your-domain.example/reset-password`.

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

`check:env` verifies required production variables, HTTPS app URL, admin invite code strength, and reminds operators to validate password-reset email settings in Supabase. `check:predeploy` verifies required files, lint, TypeScript, and production build.

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

`check:prod` verifies environment, data access, storage, upload limits, optional integrations, and password-reset readiness reminders. `check:pilot` verifies public supply and demand, including open project demands, training demands, approved service providers, approved training providers, and recommended matches.

## 6. Manual Smoke Test

1. Register a buyer.
2. Send a password reset email and complete the `/reset-password` flow.
3. Complete the subject profile.
4. Register an admin with `ADMIN_INVITE_CODE`.
5. Approve the buyer profile in admin.
6. Post a free project.
7. Approve the project in admin.
8. Register a creator.
9. Complete creator profile.
10. Approve creator profile in admin.
11. Creator opens public projects and expresses interest.
12. Buyer sees the lead in `/buyer`.
13. Publish a training demand from a buyer account.
14. Complete a training provider profile.
15. Confirm the training provider appears in `/creators`.
16. Submit a trial feedback item from the feedback widget.
17. Admin sees activity, lead, feedback, and report metrics.

## 7. Rollback

If a deployment is bad:

1. In Vercel, open Deployments.
2. Select the previous successful deployment.
3. Click Promote to Production.
4. Re-run `npm run check:prod`.

## 8. Production Operating Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Keep `ADMIN_INVITE_CODE` private and rotate it after staff changes.
- Keep AI provider keys server-side only and verify one real `/api/agent/story` request after deployment.
- Review new buyer profiles and projects before making them public.
- Review creator profiles before allowing active outreach.
- Handle reports from the admin report queue.
- Keep legal pages aligned with the actual operating entity.
- Enable a recurring database backup policy in Supabase before broad rollout.
- Export or snapshot key operational data before any schema migration.
