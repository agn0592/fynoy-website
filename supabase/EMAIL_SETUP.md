# Email setup — `info@fynoy.com` via Resend

Supabase Auth needs SMTP credentials to send confirmation / password-reset / magic-link
emails from `info@fynoy.com`. Adding the Resend API key to Vercel env vars is **not**
enough — Supabase needs the same key configured inside its own SMTP settings.

## 1. Verify `fynoy.com` in Resend

Resend will not accept SMTP traffic on your behalf until the domain is verified.

1. Log in to Resend → **Domains** → **Add Domain**.
2. Enter `fynoy.com`.
3. Resend gives you a set of DNS records. They will look roughly like:

   | Type  | Name                            | Value                          |
   |-------|---------------------------------|--------------------------------|
   | MX    | `send.fynoy.com`                | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
   | TXT   | `send.fynoy.com`                | `v=spf1 include:amazonses.com ~all` |
   | TXT   | `resend._domainkey.fynoy.com`   | `p=...` (DKIM key — long string)    |
   | TXT   | `_dmarc.fynoy.com`              | `v=DMARC1; p=none;`                 |

4. Open Namecheap → **Domain List → Manage → Advanced DNS**.
5. Add each record exactly as Resend gives them. Namecheap names:
   - `MX Record` for the MX
   - `TXT Record` for each TXT
   - Hostname is just the prefix (e.g. `send`, `resend._domainkey`, `_dmarc`) —
     Namecheap appends `.fynoy.com` automatically.
6. Back in Resend, click **Verify DNS records**. Propagation usually < 10 min.

## 2. Configure SMTP in Supabase

1. Supabase Dashboard → **Project Settings → Authentication → SMTP Settings**
   (or **Auth → SMTP Settings** in the new dashboard).
2. Toggle **Enable Custom SMTP** on.
3. Fill in:

   | Field            | Value                       |
   |------------------|-----------------------------|
   | Sender email     | `info@fynoy.com`            |
   | Sender name      | `Fynoy Capital`             |
   | Host             | `smtp.resend.com`           |
   | Port             | `465` (or `587` with STARTTLS) |
   | Username         | `resend`                    |
   | Password         | the Resend API key (`re_...`) |
   | Minimum interval | `60` seconds (rate limit guard) |

4. Click **Save**.
5. Send yourself a test invite from **Auth → Users → Invite user** to confirm
   the mail arrives from `info@fynoy.com`.

## 3. Paste the branded email templates

The repo ships three HTML templates under `supabase/email_templates/`:

| File                              | Supabase template               |
|-----------------------------------|---------------------------------|
| `confirmation.html`               | **Confirm signup**              |
| `recovery.html`                   | **Reset password**              |
| `magic_link.html`                 | **Magic Link**                  |

For each one:

1. Supabase Dashboard → **Auth → Email Templates** → pick the template.
2. **Subject** suggestions:
   - Confirm signup: `Confirm your Fynoy Capital account`
   - Reset password: `Reset your Fynoy Capital password`
   - Magic link: `Sign in to Fynoy Capital`
3. Switch the body editor to **HTML** (not "Plain").
4. Paste the contents of the matching `.html` file.
5. Save. Supabase will substitute `{{ .ConfirmationURL }}` and friends at send time.

## 4. Site URL & redirect allowlist

Supabase needs to know which URLs it is allowed to redirect users to after
confirmation / recovery.

1. **Auth → URL Configuration**.
2. **Site URL**: `https://fynoy.com`.
3. **Redirect URLs** — add these (one per line):
   - `https://fynoy.com/auth/callback`
   - `https://fynoy.com/auth/reset-password`
   - `https://fynoy.com/dashboard`
   - (optional staging / preview URLs)

## 5. Vercel envs

The Vercel `RESEND_API_KEY` is currently unused by the app code — it only
matters once we send transactional emails directly from the API (e.g. trade
alerts). Leaving it set is fine. The Supabase SMTP block is the one that
sends auth mails today.

If you ever want the app itself to send mails (not just Supabase), keep the
key under `RESEND_API_KEY` in Vercel and we can wire `@resend/node` into a
route handler.
