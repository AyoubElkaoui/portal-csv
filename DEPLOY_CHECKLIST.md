# ✅ Pre-Deploy Checklist

Gebruik deze checklist voordat je de updates deployed naar productie.

## 📋 Voor Deployment

### 1. Code Controleren
- [x] Alle wijzigingen zijn gemaakt
- [x] Build succesvol zonder errors
- [x] TypeScript types correct
- [x] Database migrations gemaakt
- [x] Seed script gemaakt

### 2. Environment Variables Checken
Check of deze variabelen correct zijn in `.env.local`:

```bash
# Database - moet naar je productie database wijzen
DATABASE_URL="postgresql://..."

# NextAuth - MOET een sterke secret zijn in productie!
NEXTAUTH_SECRET="genereer-nieuwe-sterke-secret"  # ⚠️ WIJZIG DIT!
NEXTAUTH_URL="https://jouw-domein.nl"            # ⚠️ WIJZIG DIT!

# Email (Resend)
RESEND_API_KEY="re_..."                          # ⚠️ CHECK DIT!
FROM_EMAIL="noreply@jouw-domein.nl"              # ⚠️ WIJZIG DIT!

# User Credentials
ANISSA_EMAIL="anissa@bedrijf.nl"                 # ⚠️ WIJZIG DIT!
ANISSA_PASSWORD="veilig-wachtwoord"              # ⚠️ WIJZIG DIT!
REVIEWER_EMAIL="reviewer@bedrijf.nl"             # ⚠️ WIJZIG DIT!
REVIEWER_PASSWORD="veilig-wachtwoord"            # ⚠️ WIJZIG DIT!

# App URL
NEXT_PUBLIC_APP_URL="https://jouw-domein.nl"    # ⚠️ WIJZIG DIT!
```

### 3. Deployment Stappen

```bash
# 1. Backup je huidige database (BELANGRIJK!)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull de nieuwe code
git pull origin main

# 3. Installeer dependencies
npm install

# 4. Voer database migraties uit
npx prisma migrate deploy

# 5. Genereer Prisma Client
npx prisma generate

# 6. Seed default settings (alleen eerste keer!)
npx tsx prisma/seed.ts

# 7. Build de applicatie
npm run build

# 8. Restart de server
# Voor PM2:
pm2 restart portal

# Voor systemd/andere:
sudo systemctl restart portal
# of
npm start
```

### 4. Na Deployment

#### Test de volgende dingen:

**Login Test:**
- [ ] Kan inloggen als Anissa (uploader)
- [ ] Kan inloggen als Reviewer
- [ ] Dashboard toont juiste informatie per rol

**Settings Test:**
- [ ] Ga naar `/settings`
- [ ] Vul de email adressen in:
  - Uploader Email: `anissa@juist-adres.nl`
  - Reviewer Email: `reviewer@juist-adres.nl`
- [ ] Klik "Opslaan"
- [ ] Refresh pagina - emails moeten nog steeds zichtbaar zijn

**Upload Test (als Anissa):**
- [ ] Ga naar `/upload`
- [ ] Upload een test CSV/Excel bestand
- [ ] Krijg je "Upload succesvol!" bericht
- [ ] Word je doorgestuurd naar dashboard
- [ ] Zie je "Upload bij reviewer" bericht
- [ ] Probeer opnieuw te uploaden - moet geblokkeerd zijn

**Email Test:**
- [ ] Check of reviewer een email heeft ontvangen over nieuwe upload
- [ ] Check of Anissa een bevestigings email heeft ontvangen

**Review Test (als Reviewer):**
- [ ] Login als reviewer
- [ ] Dashboard toont 1 upload met "Wacht op Review" status
- [ ] Klik "Review bestand"
- [ ] Markeer enkele rijen als goedgekeurd/problemen
- [ ] Voeg opmerkingen toe
- [ ] Submit review
- [ ] Bestand moet verdwijnen van reviewer dashboard
- [ ] Check of Anissa een email heeft ontvangen

**Download Test (als Anissa):**
- [ ] Login als Anissa
- [ ] Dashboard toont "✓ Gereviewed - Klaar voor download"
- [ ] Klik op bestand
- [ ] Kies Excel format en download
- [ ] Excel bestand is correct en leesbaar
- [ ] Ga terug naar dashboard - bestand moet verdwenen zijn
- [ ] Upload pagina moet nu weer werken

**PDF Download Test:**
- [ ] Upload een nieuw bestand
- [ ] Laat reviewer reviewen
- [ ] Download als PDF
- [ ] PDF is clean en professioneel
- [ ] Alle data is zichtbaar en correct

### 5. Productie Configuratie

**BELANGRIJK - Verwijder test data:**
```bash
# Als je test uploads hebt gemaakt, verwijder ze:
# Login op Prisma Studio
npx prisma studio

# Of via SQL:
# DELETE FROM "Upload" WHERE filename LIKE '%test%';
```

**Verifieer Settings:**
```bash
# Check of settings correct zijn in database
npx prisma studio
# Open Settings tabel
# Verifieer uploaderEmail en reviewerEmail
```

### 6. Monitoring

Na deployment, monitor het volgende:

**Logs:**
```bash
# PM2 logs
pm2 logs portal --lines 100

# Of systemd logs
journalctl -u portal -n 100 -f
```

**Database:**
```bash
# Check of alle tabellen bestaan
npx prisma studio
# Verifieer: User, Upload, AuditLog, Settings
```

**Emails:**
- [ ] Test volledige flow end-to-end
- [ ] Verifieer dat emails aankomen
- [ ] Check spam folders als emails niet aankomen

---

## 🚨 Troubleshooting

### Als emails niet aankomen:

1. Check Resend dashboard voor errors
2. Verifieer RESEND_API_KEY is correct
3. Verifieer FROM_EMAIL is correct en geverifieerd
4. Check Settings pagina - zijn de juiste ontvangers ingesteld?

### Als build faalt:

```bash
# Clear cache en rebuild
rm -rf .next
npm run build
```

### Als Prisma errors:

```bash
# Regenereer client
npx prisma generate

# Check database connectie
npx prisma db push
```

### Als uploads niet werken:

1. Check file upload permissions
2. Check database connectie
3. Check logs voor errors
4. Verifieer Settings zijn correct

---

## 📞 Support Contact

Bij problemen, check:
1. **CHANGELOG.md** - Wat is er veranderd
2. **DEPLOYMENT.md** - Deployment instructies
3. **SOLUTIONS.md** - Technische oplossingen
4. **WORKFLOW.md** - Systeem flow diagram
5. **Server logs** - PM2/systemd logs
6. **Browser console** - Client-side errors

---

## ✅ Final Checklist

Voor je de applicatie live zet:

- [ ] Alle environment variables zijn correct
- [ ] Database backup is gemaakt
- [ ] Migrations zijn succesvol uitgevoerd
- [ ] Build is succesvol zonder errors
- [ ] Login werkt voor beide gebruikers
- [ ] Settings pagina werkt en email adressen zijn correct
- [ ] Volledige upload/review/download flow getest
- [ ] Email notificaties werken correct
- [ ] Automatisch verwijderen werkt
- [ ] Upload blokkade werkt bij pending uploads
- [ ] Excel download werkt
- [ ] PDF download werkt

**Als alle items checked zijn, is de applicatie klaar voor gebruik!** 🎉
