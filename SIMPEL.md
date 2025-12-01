# ✅ SIMPELE UITLEG

## WAT JE NODIG HEBT:

### In .env file (6 variables):
```
DATABASE_URL=     (van Neon)
NEXTAUTH_SECRET=  (al ingevuld)
NEXTAUTH_URL=     (al ingevuld)
NEXT_PUBLIC_APP_URL= (al ingevuld)
RESEND_API_KEY=   (van resend.com)
FROM_EMAIL=       (al ingevuld)
```

**DAT IS ALLES!**

## GEEN LOGINS IN .ENV!

Je **hoeft GEEN** email/wachtwoord in environment variables!
- Login credentials staan in de database
- Je kunt ze wijzigen via Settings in de app
- Default na seed: anissa@elmarservices.nl / anissa123

## STEPS:

### 1. Seed de database (1x doen):
```bash
npm run seed
```

### 2. Start de app:
```bash
npm run dev
```

### 3. Log in:
- Email: `anissa@elmarservices.nl`
- Wachtwoord: `anissa123`

### 4. Wijzig je gegevens:
- Ga naar **Settings** 
- Wijzig je email en wachtwoord
- Klaar!

## VOOR VERCEL:

Zet deze 6 variables in Vercel dashboard:
- DATABASE_URL (van Neon)
- NEXTAUTH_SECRET (uit je .env)
- NEXTAUTH_URL = `https://portal-cvs.vercel.app`
- NEXT_PUBLIC_APP_URL = `https://portal-cvs.vercel.app`
- RESEND_API_KEY (van resend.com)
- FROM_EMAIL = `info@akwebsolutions.nl`

Dan:
```bash
npx vercel env pull .env.production
npm run seed  # Om users aan te maken
```

## DAT IS HET!

Geen ingewikkelde shit meer. Gewoon:
1. .env met 6 variables
2. Seed database
3. Log in
4. Wijzig credentials in Settings
5. Klaar!

🎉
