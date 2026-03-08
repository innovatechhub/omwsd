# OMSWD Pandan Assistance Request System

Frontend foundation for a web-based assistance request and beneficiary management system for the Office of Municipal Social Welfare and Development (OMSWD) in Pandan, Antique.

## Stack

- React 19
- Vite 7
- TypeScript
- Tailwind CSS
- shadcn/ui primitives
- React Router
- TanStack Query
- Supabase client

## Current Scope

The project currently includes:

- public, admin, and resident layout shells
- homepage and dashboard scaffolds
- Supabase client and environment wiring
- auth/session/profile provider foundation
- reusable auth, profile, query, mutation, and storage service helpers

Planned next modules include authentication screens, route guards, request forms, admin review tools, document uploads, and reporting.

## Environment

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

An example file is available at [`.env.example`](/d:/React%20Project/omswd/.env.example).

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
```

On Windows PowerShell with script execution restrictions, use `npm.cmd` instead of `npm`.

## Project Structure

```text
src/
  app/
  components/
  features/
  hooks/
  integrations/supabase/
  lib/
  pages/
  routes/
  services/
  types/
  utils/
```

## Notes

- If Supabase environment variables are missing, the app falls back to safe placeholder values and the auth layer remains disabled.
- The profile service falls back to `user_metadata` until a `profiles` table is available in Supabase.
