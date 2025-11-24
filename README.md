This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, set up the database:

### Local Development (SQLite)

For local development, the project uses SQLite:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Production (PostgreSQL)

For production deployment, you need a PostgreSQL database:

1. Create a PostgreSQL database (e.g., on Vercel Postgres, Supabase, or any PostgreSQL provider)
2. Copy `.env.example` to `.env` and update the `DATABASE_URL`
3. Run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

## Email Configuration (Resend)

Deze applicatie gebruikt Resend voor email verzending. Je hebt twee opties:

### Optie 1: Gratis Vercel Domein (Gemakkelijkste)
- Gebruik: `FROM_EMAIL="onboarding@resend.dev"` (werkt direct)
- Geen DNS configuratie nodig
- Emails worden verzonden vanaf `resend.dev` domein

### Optie 2: Eigen Bedrijfsdomein (Professioneel)
- Gebruik: `FROM_EMAIL="noreply@akwebsolutions.nl"`
- Vereist DNS configuratie in je domeinbeheer
- Emails worden verzonden vanaf je eigen domein

#### DNS Configuratie voor akwebsolutions.nl:
Voeg deze records toe aan je DNS instellingen:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;

Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com

Type: CNAME
Name: resend2._domainkey
Value: resend2._domainkey.resend.com

Type: CNAME
Name: resend3._domainkey
Value: resend3._domainkey.resend.com
```

### Resend Account Setup:
1. Ga naar [resend.com](https://resend.com) en maak een account aan
2. Ga naar API Keys en maak een nieuwe API key
3. Stel `RESEND_API_KEY` in op Vercel of in je `.env` bestand
4. Kies je FROM_EMAIL adres (zie opties hierboven)

## Deploy on Vercel

### 1. Database Setup

1. Create a PostgreSQL database on [Vercel Postgres](https://vercel.com/storage/postgres) or another provider
2. Copy the connection string

### 2. Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `RESEND_API_KEY`: Your Resend API key
3. Deploy

### 3. Database Migration

After deployment, run the database migration:

```bash
# Via Vercel CLI
vercel prisma db push
```

Or trigger it manually in the Vercel dashboard under your project's "Storage" tab.

## Features

- Invoice management system
- CSV upload and processing
- Professional email templates
- Real-time analytics dashboard
- Dark mode support
- Mobile responsive design

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Email**: Resend
- **Charts**: Recharts
- **Icons**: Lucide React
