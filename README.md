# HelioCoreOS

A portfolio-grade Solar EPC operations platform connecting commercial, engineering, procurement, installation, quality, commissioning, and handover workflows.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, and Row Level Security

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Project URL and Publishable Key from the Supabase **Connect** dialog.
3. Run `npm install`.
4. Run `npm run dev`.

## Database

The initial schema is stored in `supabase/migrations`. Apply it with the Supabase CLI or paste it into the Supabase SQL editor during initial setup.

Never commit `.env.local` or any service-role/secret key.
