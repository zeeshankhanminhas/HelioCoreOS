# HelioCoreOS

A portfolio-grade Solar EPC operations platform connecting commercial, engineering, procurement, installation, quality, commissioning, and handover workflows.

## Project governance

HelioCoreOS is governed by the [HelioCoreOS Constitution](./CONSTITUTION.md), adapted from the Verilogix framework.

The constitution is the controlling build document for:

- product scope;
- Solar EPC lifecycle design;
- architecture and data modelling;
- authentication, tenancy, and security;
- interface and visual decisions;
- sprint planning and acceptance criteria;
- documentation, testing, and deployment.

Every sprint and material implementation decision must comply with it. When convenience conflicts with the constitution, the constitution takes precedence.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Vercel
- GitHub

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Project URL and Publishable Key from the Supabase **Connect** dialog.
3. Run `npm install`.
4. Run `npm run dev`.

## Database

The initial schema is stored in `supabase/migrations`. Apply it with the Supabase CLI or paste it into the Supabase SQL editor during initial setup.

All future schema changes must be represented by ordered migration files in accordance with the constitution.

Never commit `.env.local` or any service-role, secret, database password, or private connection credential.

## Current delivery stage

**Sprint 1 — Governed Application Foundation**

The current sprint establishes authentication, session handling, protected routes, organisation and profile bootstrap, application navigation, and truthful Supabase-backed dashboard summaries.
