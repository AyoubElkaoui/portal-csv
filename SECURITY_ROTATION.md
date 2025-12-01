# 🚨 BELANGRIJK: Exposed Secrets Rotatie

GitHub heeft gedetecteerd dat er secrets zijn geëxposed. Je MOET deze rotaten:

## 1. Resend API Key Rotaten

1. Ga naar: https://resend.com/api-keys
2. Delete de oude key: `re_dtqnHm5u_4CeWspZWvRNXgoedZga96YBK`
3. Create new API key
4. Update in Vercel:
   - Ga naar: https://vercel.com/ayoubs-projects-ef2be7d4/portal-cvs/settings/environment-variables
   - Update `RESEND_API_KEY` met nieuwe waarde

## 2. Database Connection String Rotaten (Neon)

1. Ga naar: https://console.neon.tech
2. Selecteer je project
3. Ga naar Settings → Reset connection string of maak nieuwe branch
4. Kopieer de nieuwe DATABASE_URL
5. Update in Vercel environment variables

## 3. NEXTAUTH_SECRET Rotaten

```bash
# Genereer nieuwe secret
openssl rand -base64 32
```

Update in Vercel environment variables.

## 4. Vercel Environment Variables Instellen

Ga naar: https://vercel.com/ayoubs-projects-ef2be7d4/portal-cvs/settings/environment-variables

Stel IN (met nieuwe/veilige waarden):

```
DATABASE_URL=<nieuwe-neon-url>
NEXTAUTH_SECRET=<nieuwe-secret>
NEXTAUTH_URL=https://portal-cvs.vercel.app
RESEND_API_KEY=<nieuwe-resend-key>
FROM_EMAIL=info@akwebsolutions.nl
NEXT_PUBLIC_APP_URL=https://portal-cvs.vercel.app
ANISSA_EMAIL=<jouw-keuze>
ANISSA_PASSWORD=<sterk-wachtwoord>
REVIEWER_EMAIL=<jouw-keuze>
REVIEWER_PASSWORD=<sterk-wachtwoord>
```

## 5. Na Vercel Deploy - Seed Database

```bash
# Installeer Vercel CLI
npm i -g vercel

# Pull productie env vars
vercel env pull .env.production

# Run seed
npx tsx prisma/seed.ts
```

## 6. Verwijder dit bestand

Na het uitvoeren van bovenstaande stappen:
```bash
rm SECURITY_ROTATION.md
git add SECURITY_ROTATION.md
git commit -m "Remove security rotation instructions"
git push
```

---

## ✅ Checklist

- [ ] Resend API key geroteerd
- [ ] Database URL geroteerd  
- [ ] NEXTAUTH_SECRET geroteerd
- [ ] Alle environment variables ingesteld in Vercel
- [ ] Vercel heeft automatisch deployed
- [ ] Database geseeded met nieuwe users
- [ ] Login getest op portal-cvs.vercel.app
- [ ] Dit bestand verwijderd

---

## 📞 Support

Als je problemen hebt, check:
- Vercel deployment logs
- Vercel environment variables
- Database connectiviteit
- SETUP.md voor troubleshooting
