# Rosado Gems — Full Backup & Hosting Guide

This bundle contains everything needed to run the website on your own server.

```
app/                    complete website source code (no node_modules)
db/schema.sql           all database structure, security rules and functions
db/data.sql             all current content (products, blogs, pages, orders, settings)
db/migrate-storage.mjs  script that copies uploaded images to the new backend
HOSTING-GUIDE.md        this file
```

Not included: uploaded image files (~441 MB in the `admin-media` bucket) and login
accounts/passwords. Both are handled in Step 3 and Step 6 below.

---

## 1. Requirements

- Node.js 20+ (or Bun) on your machine
- A Supabase project (cloud or self-hosted) — this is the database, auth, storage
- A host for the site itself: Cloudflare Workers/Pages, Netlify, Vercel, or any Node server

## 2. Restore the database

In your new Supabase project, open the SQL editor and run, in this order:

1. `db/schema.sql`
2. `db/data.sql`

If a statement fails because an extension or role is missing, create it and re-run only
the failed part. Running `data.sql` twice is safe — existing rows are skipped.

## 3. Copy the uploaded images

```bash
npm i @supabase/supabase-js
OLD_URL="https://<old-project>.supabase.co" OLD_SERVICE_KEY="<old service key>" \
NEW_URL="https://<new-project>.supabase.co" NEW_SERVICE_KEY="<new service key>" \
node db/migrate-storage.mjs
```

This recreates the `admin-media` bucket and copies every product, blog and page image.

## 4. Configure the site

In `app/`, create a `.env` file:

```
VITE_SUPABASE_URL="https://<new-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<new anon/publishable key>"
VITE_SUPABASE_PROJECT_ID="<new project ref>"
SUPABASE_URL="https://<new-project>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<new anon/publishable key>"
SUPABASE_SERVICE_ROLE_KEY="<new service role key>"
```

Payment credentials (Razorpay, PayPal, Payoneer) are stored in the database and are
re-entered from Admin → Payments after go-live. Also set, if used:
`LOVABLE_API_KEY` (AI assistant), and webhook secrets for each gateway.

## 5. Run and deploy

```bash
cd app
npm install        # or: bun install
npm run dev        # local check at http://localhost:8080
npm run build      # production build
```

The build output is a server bundle (TanStack Start + Nitro, Cloudflare Workers target
by default).

- **Cloudflare Workers/Pages**: connect the repo, build command `npm run build`, and add
  the same environment variables in the project settings.
- **Netlify / Vercel**: same build command; set the environment variables in the
  dashboard. Adjust the Nitro preset in `vite.config.ts` if your host needs `node-server`.
- **Own VPS**: `npm run build`, then run the generated server output behind Nginx with
  HTTPS (Let's Encrypt) and a process manager such as PM2.

## 6. Accounts and final checks

- User logins are not part of this bundle. Create the admin account in the new backend
  (Authentication → Users), then add an `admin` row for that user id in the `user_roles`
  table.
- In the new backend, set the Site URL and Redirect URLs to your new domain, and enable
  Google sign-in again if you use it.
- Point your domain's DNS at the new host.
- Re-enter payment gateway keys and re-register the webhook URLs
  (`/api/public/webhooks/razorpay`, `/paypal`, `/payoneer`) with the new domain.
- Test: homepage, a product page with variants, add to cart, checkout, admin login,
  a test order and refund.
