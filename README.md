# Vybz

Vybz is a mobile-first social app where people sign up, create a profile, upload photo moments, and rate the vibe of other posts from 1 to 5 stars.

## Local Setup

1. Install dependencies with `npm install`.
2. Create `.env` from `.env.example`.
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run `npm run dev`.

This is now a real Supabase-backed app. If either Vite environment variable is missing, the app shows a setup error instead of falling back to demo data.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Confirm these tables exist:
   - `profiles`
   - `posts`
   - `ratings`
   - `follows`
   - `blocks`
   - `reports`
   - `moderation_actions`
   - `delete_account_requests`
5. Confirm RLS is enabled on those tables.

For a brand-new Supabase project, run the whole schema once. If you already ran the earlier proof-of-concept schema, use a fresh project for the cleanest beta setup or review the migration sections carefully before running against real data.

## Auth Setup

In Supabase, enable Email auth under Authentication. Email/password sign up and login are used in the app.

If email confirmations are enabled, new users must confirm their email before onboarding. If confirmations are disabled, sign up sends the user directly to profile creation.

Google sign-in is shown as coming soon and is disabled until OAuth is configured.

## Storage Setup

The SQL creates public buckets:

- `avatars`
- `post-images`

Both buckets allow public reads. Upload, update, and delete are restricted to files stored under the authenticated user's ID folder, for example:

- `avatars/<user-id>/avatar.webp`
- `post-images/<user-id>/moment.webp`

Accepted upload formats are JPG, JPEG, PNG, and WebP. The current frontend limit is 5MB.

## Admin Setup

Admins are controlled with `profiles.is_admin = true`.

To promote an account, set `is_admin` for that profile from the Supabase dashboard or SQL editor. Do not expose service role keys in the frontend.

Admin users can view open reports, dismiss reports, remove posts, and suspend or ban users.

## Delete Account Approach

This app uses safe option A: `delete_account_requests`.

The frontend inserts a deletion request for the logged-in user. It does not delete auth users directly and never uses a service role key. An admin can review the request and delete the auth user from Supabase or through a future secure server-side function.

## Manual Netlify Deploy

Because this project is manually deployed, Vite environment variables must be present before building locally.

1. Add real Supabase values to `.env`.
2. Run `npm run build`.
3. Confirm `dist/index.html` and `dist/assets` exist.
4. Confirm `dist/_redirects` contains `/* /index.html 200`.
5. Upload the contents of `dist` or the generated ZIP to Netlify.

Manual deploy limitations:

- Netlify will not rebuild the app for you.
- Netlify UI environment variables do not affect an already-built ZIP.
- Any Supabase URL/key change requires a new local build and upload.
- There are no automatic deploy previews without Git.

## PWA Notes

The app includes a manifest, theme color, SVG icons, and a small service worker for the app shell. For a public app-store-grade release, replace placeholder SVG icons with final PNG exports at standard sizes.
