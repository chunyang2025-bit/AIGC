# Pilot Launch Checklist

## 1. Before Opening Access

- Production Supabase project is created.
- `supabase/schema.sql` has been executed.
- Storage buckets exist:
  - `public-assets`
  - `private-verifications`
- Vercel environment variables are configured.
- `ADMIN_INVITE_CODE` is strong and private.
- `NEXT_PUBLIC_APP_URL` is the production HTTPS domain.
- `npm run check:env` passes with production variables loaded.
- `npm run check:predeploy` passes.
- `/api/health` returns `data.ok: true`.
- `npm run check:prod` passes.
- `npm run check:pilot` passes against the production URL.

## 2. Seed Supply And Demand

Prepare before inviting broader users. The platform should not look empty when the first visitor arrives:

- 3-5 real buyer-side organizations.
- 10-20 real creators or service providers.
- At least 5 approved creator or service provider profiles.
- At least 2 approved training providers.
- At least 5 approved creator profiles with service packages.
- At least 3 approved public projects.
- At least 2 non-training project demands.
- At least 1 training demand.
- At least 2 public projects with recommended candidate matches.
- At least 1 internal admin account.

Run:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.example npm run check:pilot
```

## 3. Manual Smoke Test

Run these flows on production:

- Buyer registers.
- Buyer completes subject profile.
- Admin approves buyer.
- Buyer posts a free project.
- Admin approves project.
- Creator registers.
- Creator completes creator profile and service packages.
- Admin approves creator.
- Creator expresses interest in an open project.
- Buyer invites a creator from matching result.
- Training demand buyer publishes a training demand.
- Training provider profile appears in creator/training provider listings.
- Order/lead detail opens.
- Message can be sent.
- Report can be submitted.
- Admin can process report.
- Admin can suspend and unsuspend a test account.
- Feedback widget can submit a trial suggestion.

## 4. First Pilot Window

Recommended first batch:

- 20-50 total users.
- 3-7 days.
- Operations checks admin queue at least twice per day.
- Record every failed registration, rejected review, and user complaint.
- Send invitations in four batches instead of one generic blast:
  - Project demand buyers.
  - AIGC service providers.
  - Training demand buyers.
  - Training providers or training institutions.

## 5. Success Signals

Continue expanding if:

- Registration and login are stable.
- Buyer profile review is understandable.
- Project review queue is manageable.
- Creators understand recommended opportunities.
- Buyers understand intent budget and free posting.
- Training buyers understand they are requesting a course plan and quote, not buying a fixed course.
- Training providers understand they can generate a public training homepage and share it.
- At least 30% of approved projects produce a communication lead.
- No serious abuse or legal risk appears.

## 6. Stop Or Slow Down If

- Users misunderstand the platform as escrow/payment.
- Many fake projects or fake creator profiles appear.
- Review queue cannot be processed within 24 hours.
- Upload or auth errors appear repeatedly.
- Reports cannot be resolved by operations.

## 7. Expansion Gate

Before expanding beyond the first pilot:

- Review onboarding copy.
- Review rejection reasons.
- Add common FAQ from user questions.
- Improve notification strategy.
- Decide whether email/SMS is needed.
- Confirm legal pages with the operating entity.
