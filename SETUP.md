# CSV Portal Setup Guide

## 🚀 Deployment naar Vercel

### Stap 1: Environment Variables Instellen

Ga naar Vercel Dashboard → Settings → Environment Variables en voeg toe:

#### Verplicht:
- `DATABASE_URL` - Je Neon/PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret (genereer met: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - `https://portal-cvs.vercel.app`
- `RESEND_API_KEY` - Je Resend API key
- `FROM_EMAIL` - Je verzend email adres
- `NEXT_PUBLIC_APP_URL` - `https://portal-cvs.vercel.app`

#### Optioneel (voor seeding):
- `ANISSA_EMAIL` - Email voor uploader account
- `ANISSA_PASSWORD` - Wachtwoord voor uploader
- `REVIEWER_EMAIL` - Email voor reviewer account  
- `REVIEWER_PASSWORD` - Wachtwoord voor reviewer

### Stap 2: Deploy

Push je code naar GitHub - Vercel deployed automatisch.

### Stap 3: Database Seeden (NA DEPLOYMENT)

**Optie 1: Via Vercel CLI (Recommended)**
```bash
# Installeer Vercel CLI als je die nog niet hebt
npm i -g vercel

# Login
vercel login

# Link je project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run seed
npx tsx prisma/seed.ts
```

**Optie 2: Lokaal met productie database**
```bash
# Stel productie DATABASE_URL in
export DATABASE_URL="<jouw-productie-database-url>"

# Run seed
npx tsx prisma/seed.ts
```

**Optie 3: Via Prisma Studio**

Je kunt ook handmatig users aanmaken via Prisma Studio:
```bash
npx prisma studio
```

Maak 2 users aan met:
- Email
- Name  
- Role ('uploader' of 'reviewer')
- Password (hash eerst met bcrypt)

---

## 🔒 Security - Belangrijke Info

### ⚠️ NOOIT committen:
- `.env`
- `.env.local`  
- `.env.production`
- Bestanden met API keys, wachtwoorden, of database URLs

### ✅ Wel committen:
- `.env.example` (zonder echte credentials)

### 🔑 API Keys Roteren

Als je per ongeluk keys hebt gecommit:

1. **Resend API Key:**
   - Ga naar https://resend.com/api-keys
   - Revoke de oude key
   - Genereer nieuwe key
   - Update in Vercel

2. **Database URL:**
   - Als je Neon gebruikt: reset connection string in dashboard
   - Update in Vercel environment variables

3. **NEXTAUTH_SECRET:**
   - Genereer nieuwe: `openssl rand -base64 32`
   - Update in Vercel

4. **Force git history cleanup (als nodig):**
```bash
# Gebruik BFG Repo-Cleaner of git-filter-repo
# Dit is complex - overweeg om nieuwe repo te maken als keys echt exposed zijn
```

---

## 👥 Login na Setup

Na seeding kun je inloggen met de credentials die je hebt ingesteld in de environment variables.

Default (als geen env vars):
- Uploader: anissa@example.com / anissa123
- Reviewer: reviewer@example.com / reviewer123

---

## 🔧 Lokale Development

1. Kopieer `.env.example` naar `.env`:
```bash
cp .env.example .env
```

2. Vul je lokale credentials in `.env`

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Seed de database:
```bash
npx tsx prisma/seed.ts
```

5. Start development server:
```bash
npm run dev
```

---

## 📝 Wachtwoord Wijzigen

Users kunnen hun wachtwoord wijzigen via:
Settings → Login Credentials

---

## ❓ Troubleshooting

### "Invalid credentials" bij login
→ Run seed script opnieuw

### Session blijft hangen
→ Check `NEXTAUTH_URL` (geen trailing slash!)
→ Check `NEXTAUTH_SECRET` is ingesteld

### Database connection error  
→ Verifieer `DATABASE_URL` format
→ Check database is accessible vanaf Vercel
