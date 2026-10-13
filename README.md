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

## October 2026 document enhancements

The changes from `For-Enhanced.docx` include a grouped requirement table with aligned status and file columns, document previews inside the resident application details, and a shared image/PDF viewer used by sector reviews. The intake sheet now reads `first_name`, `middle_name`, `last_name`, and `suffix` from the linked resident record instead of splitting a display name. Both identifying-information tables use the same fixed column grid. If a resident record is missing, the full applicant name remains visible and the individual name fields are left blank.

Run `npm run test` to check name placement, print table alignment, and safe rendering of saved values. Run `npm run build` for TypeScript checks and the production build.

The intended production address is `https://omswd.vercel.app`. Before deploying the domain redirect in `vercel.json`, assign `omswd.vercel.app` to this project in Vercel and confirm it serves the application. The redirect sends only requests on the old `omwsd.vercel.app` host to the matching path on the corrected host; preview and local URLs are unaffected. This configuration does not reserve or assign a Vercel domain.

Update Supabase Authentication's Site URL to `https://omswd.vercel.app` and allow the application's email-confirmation and password-reset redirect URLs on that host. Authentication uses the current browser origin, so these settings must be ready when the domain changes. Keep the old domain assigned if it should continue redirecting existing bookmarks.

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
