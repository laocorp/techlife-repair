# TechRepair SaaS

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Setup

Run the SQL migration in your Supabase SQL Editor. See `/supabase/migrations/` for the complete schema.

## Tech Stack

- **Next.js 15** - App Router + Server Actions
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **Supabase** - Auth + Database + Storage
- **Zod** - Validation
