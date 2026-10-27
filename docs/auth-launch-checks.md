# Authentication launch checks

## Read-only production audit (20 September 2026)

- The 29 authentication users all had matching profiles. The profiles table also contains other records; none were deleted or changed.
- Email signup and email confirmation are enabled. Four accounts have unconfirmed email addresses.
- Provider document buckets are private.
- The provider table requires `full_name`; the previous browser signup flow omitted it and attempted uploads before email confirmation.
- The repository's previous signup trigger accepts `admin` from user metadata. This is not proof of the live trigger definition: database SQL access was unavailable.

## Database migration required

Apply `supabase/migrations/20260920010000_auth_account_integrity.sql` in the linked project's Supabase SQL Editor after reviewing it and confirming a recent backup. Do not run the entire historical migration folder blindly.

This transaction preserves existing profiles and passwords, creates only missing public-signup profiles, limits new public signup roles, and protects role, balance, verification, and provider approval fields from direct browser writes. Existing privileged accounts are not downgraded. Legitimate privileged updates must use secured server endpoints, not browser table writes.

The migration is prepared, not automatically applied. Service-role REST access cannot execute arbitrary SQL. The database safeguard remains a launch requirement until the SQL succeeds and its behavior is verified.

## Supabase dashboard configuration to verify

- Set Site URL to `https://prms-rentals-ng.vercel.app`.
- Allow the production `/login`, `/provider-login`, `/reset-password`, `/auth/callback`, and `/auth/confirm` redirect URLs. Preserve other legitimate environments; avoid broad production wildcards.
- Confirm production SMTP credentials, verified sender/domain, deliverability, and email limits. A successful API response does not prove inbox delivery.
- Keep CAPTCHA enabled. Supabase must use the secret for the same Turnstile widget whose public site key is configured in Vercel. Include the production hostname in the widget configuration. Never expose the secret with a NEXT_PUBLIC prefix.
- Confirm the project's backup retention and restore procedure. Authentication changes do not replace backups.

## Email templates and cross-browser links

Existing PKCE links are supported through `/auth/callback`, including codes sent to the existing login/reset URLs. These links require the browser that initiated the request.

For cross-browser confirmation, configure the confirmation template to link to:

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`

For recovery:

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

Do not include tokens in analytics or logs. Links are single-use; expired/used links display a recovery page. Email security scanners can consume automatic verification links, so test with your real mail provider before changing templates broadly.

## Required real-account smoke tests

Use dedicated test accounts, not customer accounts, and confirm:

1. Tenant and landlord signup creates one account/profile; duplicate clicks do not repeat signup.
2. Confirmation email arrives and opens the correct account; a used link fails safely.
3. Provider signup confirms email first, then saves private documents and a pending provider application. Admin review opens short-lived document links.
4. CAPTCHA expiry shows a fresh challenge; login, resend confirmation, and password recovery use different fresh tokens.
5. Password reset changes only the password; existing rental and payment data remains accessible.
6. Refresh/reconnect retains the session; profile/network failures show retry rather than forcing logout; account switching never displays the previous user's profile.
7. Unauthenticated/wrong-role provider submissions fail; direct browser privilege changes fail after migration; secured admin review still works with MFA.

Automated mocked regression checks are useful but do not verify live email delivery, real CAPTCHA interaction, production RLS/triggers, or backup restoration. No customer passwords, account roles, or existing rental/payment records were changed during this audit.
