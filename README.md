# Nova — GitHub Pages + Supabase Authentication

A responsive animated authentication website designed to run entirely as a static GitHub Pages site, with Supabase providing the real authentication/database layer.

## What is included

- Animated login/register UI
- Supabase Auth for real password authentication
- Supabase PostgreSQL `profiles` table for name/country/phone
- Unique names (case-insensitive)
- Login using **email OR name**
- Live password requirements
- Confirm-password validation
- Animated invalid-input shake
- Protected account page
- Logout
- No Node.js server required for GitHub Pages

## 1. Create the Supabase project

Create a free project at https://supabase.com/.

In **Project Settings → API**, copy:
- Project URL
- Publishable/anon key

Put them in `config.js`:

```js
const NOVA_CONFIG = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY"
};
```

**Never put a `service_role` key in `config.js`.**

## 2. Create the database

Open **Supabase Dashboard → SQL Editor**, paste everything from:

`supabase/schema.sql`

and run it.

This creates the profiles table, unique-name constraint, RLS policy, and the server-side helper used by name login.

## 3. Configure email authentication

In Supabase:
- Authentication → Providers → Email → enable Email.
- For the easiest GitHub Pages setup, you can disable **Confirm email** while testing.
- For a real public site, keep email confirmation enabled.

If email confirmation is enabled, users must confirm their email before they can sign in.

## 4. Deploy the name-login Edge Function

Install the Supabase CLI, log in, link your project, then run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy login-by-name
```

The function uses Supabase's server-side service-role secret internally. That secret is **not** stored in this GitHub repository or exposed to browsers.

## 5. GitHub Pages

Upload the contents of this folder to a GitHub repository.

Your repository should look like:

```text
index.html
account.html
app.js
config.js
styles.css
README.md
supabase/
  schema.sql
  functions/
    login-by-name/
      index.ts
```

Then open:

**GitHub → Repository → Settings → Pages**

Choose:

- Source: **Deploy from a branch**
- Branch: `main`
- Folder: `/ (root)`

GitHub will give you a URL such as:

`https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`

## Important security notes

`config.js` contains a browser-safe Supabase publishable/anon key. That key is expected to be public. Security comes from Supabase Auth and Row Level Security.

Do **not** commit:
- `service_role` keys
- database passwords
- private API keys
- `.env` files containing secrets

User passwords are handled by Supabase Auth; they are not stored in your GitHub repository.

## GitHub Pages limitation

GitHub Pages only serves static files. The Supabase database and authentication service run separately in Supabase. The GitHub repository therefore contains the website code and database schema, but **not the live user database**.

