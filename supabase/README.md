# Backchannel Atlas Supabase Setup

Free-tier setup for Backchannel Atlas V2.

1. Create a new Supabase project.
2. Run `supabase/migrations/20260516000000_backchannel_atlas_v2.sql` in the SQL editor or through Supabase CLI.
3. In Authentication > URL Configuration:
   - Site URL: `https://undrenalynelab.io/france-money-map/`
   - Redirect URLs:
     - `https://undrenalynelab.io/france-money-map/auth/callback/`
     - `http://localhost:3000/france-money-map/auth/callback/`
4. In Google Cloud, create an OAuth web client with authorized redirect URI:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
5. Put Google Client ID/Secret into Supabase Auth > Providers > Google.
6. Add these GitHub repository secrets for the Pages build:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit service-role keys or OAuth secrets.
