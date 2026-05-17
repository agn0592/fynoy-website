# Email-afzender configureren (info@fynoy.com)

Supabase verstuurt standaard auth-mails via een gedeelde domeinpool. Voor een
herkenbare afzender (`info@fynoy.com`) moet er custom SMTP geconfigureerd worden.

## Stappen

1. Ga naar **Supabase Dashboard → Authentication → Email Templates** en pas de
   teksten aan voor:
   - Confirmation email (registratie bevestiging)
   - Reset password email
   - Magic link email
   Gebruik Nederlands en verwijs naar `fynoy.com`.

2. Ga naar **Authentication → SMTP Settings → Custom SMTP** en zet aan:
   - Host: `smtp.resend.com` (aanbevolen) of `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey` (bij Resend / SendGrid)
   - Password: API key uit Resend dashboard
   - Sender email: `info@fynoy.com`
   - Sender name: `Fynoy Capital`

3. Verifieer het verzenddomein in je SMTP provider:
   - Resend: voeg `fynoy.com` toe onder **Domains**, zet de DKIM-, SPF- en
     return-path records in de DNS van fynoy.com.
   - Test daarna een Confirmation mail via **Auth → Users → Send invite**.

## Aanrader

Resend gratis tier dekt 3.000 mails / maand en heeft een minimale setup.
Bewaar de API key alleen in Supabase — niet in de codebase.
