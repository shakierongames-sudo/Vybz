# Supabase RLS Notes

`supabase/schema.sql` is the source of truth for Vybz database tables, policies, functions, triggers, and storage rules.

If a policy is repaired manually in the Supabase dashboard, copy the working SQL back into `supabase/schema.sql` before running the schema again or deploying future database changes.

After every schema change, test:

- posting with a normal active user
- image upload to `post-images`
- rating another user's post
- activity notification creation
- admin report review and moderation actions
- normal user access to feed, profile, settings, and blocked users

The post insert policy must continue to allow normal post creation when `auth.uid() = author_id`. Activity notification failures must not block post creation.
