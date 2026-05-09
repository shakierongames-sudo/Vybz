# Vybz Security Notes

## Safe For Beta

- The frontend uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No Supabase service role key is used in browser code.
- Email/password auth uses Supabase Auth sessions.
- Profiles, posts, ratings, follows, blocks, reports, moderation actions, and delete-account requests have RLS policies.
- Users upload only into their own Storage folder.
- Public reads for avatars and post images are acceptable for this MVP.
- Users cannot rate their own posts through the UI or RLS.
- One rating per user per post is enforced by the database.
- Reports are inserted as real moderation records.
- Blocking hides blocked users' posts in the UI and is also checked by RLS helpers.
- Delete account uses a request table instead of unsafe frontend deletion.

## Improve Before Full Public Launch

- Add automated RLS tests for every table and Storage policy.
- Move admin moderation writes to audited RPC functions or server-side functions.
- Add report throttling and abuse detection.
- Add upload scanning and stronger image moderation.
- Add Storage cleanup for deleted posts and replaced avatars.
- Add stronger account deletion handling with a server-side service role function.
- Add rate limits for ratings, reports, signups, and uploads.
- Add audit views for admin actions.
- Review blocked-user edge cases across profile, follow, rating, and report flows.
- Add Terms, Privacy Policy, and age-safety copy.
- Add backup and recovery procedures for production data.

## Google Play Readiness Notes

- Provide a privacy policy URL before Play review.
- Add account deletion instructions inside the app and in the store listing.
- Document user-generated content moderation and reporting.
- Provide block/report controls for all public user content.
- Add content safety review processes for uploaded images.
- Replace placeholder icons with production icons at Play-required sizes.
- Test installability, offline behavior, and authenticated session recovery on Android Chrome.
