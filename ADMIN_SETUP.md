# Vybz Admin Setup

Vybz uses `profiles.is_admin = true` for admin access.

To make your own account admin:

1. Sign up and complete your Vybz profile.
2. Open Supabase Dashboard.
3. Go to Table Editor, then `profiles`.
4. Copy your profile `id`.
5. Run this SQL in the Supabase SQL editor:

```sql
update public.profiles
set is_admin = false;

update public.profiles
set is_admin = true
where id = 'PASTE_MY_PROFILE_UUID_HERE';
```

After running it, log out and back in. The Settings screen will show the Admin / Moderation link.

Permanent Supabase Auth user deletion must be done manually in Supabase or through a secure server-side function. Do not put a service role key in the frontend.
