# 🚀 Deployment Instructies - Portal CVS

## Na Git Pull / Update

### Stap 1: Database Migraties Uitvoeren

```bash
# Voer database migraties uit
npx prisma migrate deploy

# Genereer Prisma Client
npx prisma generate
```

### Stap 2: Seed Default Settings (Eerste keer)

```bash
# Voeg default settings toe aan database
npx tsx prisma/seed.ts
```

### Stap 3: Build de Applicatie

```bash
# Build productie versie
npm run build
```

### Stap 4: Start de Server

```bash
# Start productie server
npm start

# OF voor development
npm run dev
```

---

## 🔧 Eerste Setup (Nieuwe Server)

### 1. Clone Repository

```bash
git clone <repository-url>
cd portal
```

### 2. Installeer Dependencies

```bash
npm install
```

### 3. Environment Variables

Maak een `.env.local` bestand aan:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# User Credentials
ANISSA_EMAIL="anissa@example.com"
ANISSA_PASSWORD="secure-password"
REVIEWER_EMAIL="reviewer@example.com"
REVIEWER_PASSWORD="secure-password"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Maak database migrations
npx prisma migrate dev

# Genereer Prisma Client
npx prisma generate

# Seed default settings
npx tsx prisma/seed.ts
```

### 5. Build & Start

```bash
npm run build
npm start
```

---

## 🔄 Update Proces

Als je code updates krijgt via Git:

```bash
# 1. Pull laatste changes
git pull origin main

# 2. Installeer nieuwe dependencies (als package.json gewijzigd)
npm install

# 3. Voer database migraties uit
npx prisma migrate deploy
npx prisma generate

# 4. Herstart de applicatie
npm run build
pm2 restart portal  # of npm start
```

---

## ⚙️ Email Settings Configureren

Na deployment:

1. Log in als admin/uploader
2. Ga naar **Settings** pagina
3. Vul de juiste email adressen in:
   - **Uploader Email**: Email van Anissa
   - **Reviewer Email**: Email van de reviewer
4. Klik op **Opslaan**

Deze settings worden opgeslagen in de database en blijven behouden.

---

## 🐛 Troubleshooting

### Database Errors

Als je database errors krijgt:

```bash
# Reset database (VOORZICHTIG: verwijdert alle data!)
npx prisma migrate reset

# Of forceer migratie
npx prisma migrate deploy --force
```

### Prisma Client Errors

```bash
# Regenereer Prisma Client
npx prisma generate
```

### Type Errors

```bash
# Check voor TypeScript errors
npm run build
```

---

## 📦 Production Deployment (PM2)

Voor productie met PM2:

```bash
# Installeer PM2 (eerste keer)
npm install -g pm2

# Start applicatie
pm2 start npm --name "portal" -- start

# Save PM2 processen
pm2 save

# Auto-start bij server reboot
pm2 startup
```

Update met PM2:

```bash
git pull origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart portal
```

---

## 🔐 Gebruikers Beheer

Gebruikers zijn geconfigureerd in `src/app/api/auth/[...nextauth]/route.ts`:

- **Uploader (Anissa)**: Email en wachtwoord via environment variables
- **Reviewer**: Email en wachtwoord via environment variables

Email notificaties gaan naar de adressen geconfigureerd in de **Settings** pagina.

---

## ✅ Verificatie Checklist

Na deployment, controleer:

- [ ] Database migraties succesvol
- [ ] Prisma Client gegenereerd
- [ ] Build succesvol zonder errors
- [ ] Applicatie draait op juiste poort
- [ ] Login werkt voor beide gebruikers
- [ ] Email settings configureerbaar in Settings pagina
- [ ] Upload werkt (met blokkade bij pending uploads)
- [ ] Review workflow werkt
- [ ] Download werkt (Excel en PDF)
- [ ] Email notificaties worden verstuurd
- [ ] Upload wordt automatisch verwijderd na download

---

## 📞 Support

Voor vragen of problemen, check:
- `CHANGELOG.md` - Voor laatste wijzigingen
- Build logs - `npm run build`
- Prisma logs - `npx prisma studio`
- Application logs - PM2 logs of console output
