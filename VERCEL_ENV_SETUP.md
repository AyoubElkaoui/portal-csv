# Vercel Environment Variables Setup

## Required Environment Variables in Vercel

Ga naar: https://vercel.com/ayoubs-projects-ef2be7d4/portal-cvs/settings/environment-variables

### Production Environment Variables

Zorg dat de volgende environment variables zijn ingesteld in Vercel:

#### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_Wpum4dV5ilgI@ep-green-art-ag6od1nb.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

#### Email (Resend)
```
RESEND_API_KEY=re_dtqnHm5u_4CeWspZWvRNXgoedZga96YBK
FROM_EMAIL=info@akwebsolutions.nl
```

#### NextAuth
```
NEXTAUTH_SECRET=efc7e0b26aa3c34988da0f79f67e4e9b6a43c156120f6a000f126fb4bf332954
NEXTAUTH_URL=https://portal-cvs.vercel.app
```

#### App URL
```
NEXT_PUBLIC_APP_URL=https://portal-cvs.vercel.app
```

## Deployment Checklist

- [x] Email template verbeterd met professionele HTML layout
- [x] Link naar portal-cvs.vercel.app toegevoegd
- [x] Prisma schema gefixed (kolom mapping naar lowercase)
- [x] DATABASE_URL in .env gefixed
- [ ] Vercel environment variables controleren/toevoegen
- [ ] Test email functionaliteit na deployment
- [ ] Controleer of settings pagina werkt in productie

## Vercel Environment Variables die al staan (volgens screenshot):

- NEXTAUTH_URL
- NEXTAUTH_SECRET
- DATABASE_URL
- DATABASE_URL_UNPOOLED
- VERCEL_OIDC_TOKEN (automatisch)
- ANISSA_EMAIL
- REVIEWER_EMAIL
- REVIEWER_PASSWORD
- ANISSA_PASSWORD

## Wat moet blijven/toegevoegd worden:

✅ Behouden:
- DATABASE_URL (check dat deze correct is)
- NEXTAUTH_SECRET
- NEXTAUTH_URL (check dat deze `https://portal-cvs.vercel.app` is)

✅ Toevoegen als ze er niet zijn:
- NEXT_PUBLIC_APP_URL=https://portal-cvs.vercel.app
- RESEND_API_KEY=re_dtqnHm5u_4CeWspZWvRNXgoedZga96YBK
- FROM_EMAIL=info@akwebsolutions.nl

⚠️ Optioneel behouden (voor seeding):
- ANISSA_EMAIL
- REVIEWER_EMAIL
- ANISSA_PASSWORD
- REVIEWER_PASSWORD

## Na deployment:

1. Test de settings pagina - moet nu werken
2. Upload een CSV en laat reviewen
3. Check of de email aankomt met de mooie template
4. Klik op de download link in de email
5. Verifieer dat de link naar portal-cvs.vercel.app werkt
