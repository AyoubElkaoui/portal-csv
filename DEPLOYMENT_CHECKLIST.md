# 🚀 DEPLOYMENT CHECKLIST

Complete deze stappen om jouw Portal-CVS live te krijgen op Vercel.

---

## ✅ **STAP 1: ROTEER EXPOSED SECRETS** (MEEST BELANGRIJK!)

GitHub heeft gemeld dat deze secrets exposed zijn. Je MOET deze vervangen:

### 1.1 Resend API Key Vervangen
1. Ga naar: https://resend.com/api-keys
2. **Verwijder oude key**: `re_dtqnHm5u_4CeWspZWvRNXgoedZga96YBK`
3. Klik op **"Create API Key"**
4. Name: `Portal-CVS-Production`
5. Permission: **Full Access**
6. Kopieer de nieuwe key en bewaar deze veilig!

### 1.2 Database URL Vervangen
1. Ga naar: https://console.neon.tech/
2. Select project: **ep-green-art-ag6od1nb**
3. Ga naar **Settings** → **Reset Connection String**
4. Kopieer de nieuwe connection string

### 1.3 NEXTAUTH_SECRET Genereren
Open terminal en run:
```bash
openssl rand -base64 32
```
Kopieer de output - dit is je nieuwe secret.

---

## ✅ **STAP 2: VERCEL ENVIRONMENT VARIABLES INSTELLEN**

1. Ga naar: https://vercel.com/
2. Selecteer je project: **portal-cvs**
3. Ga naar **Settings** → **Environment Variables**
4. Voeg ALLE onderstaande variables toe:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `DATABASE_URL` | *[nieuwe Neon connection string uit stap 1.2]* | PostgreSQL database URL |
| `NEXTAUTH_SECRET` | *[output van stap 1.3]* | NextAuth encryption secret |
| `NEXTAUTH_URL` | `https://portal-cvs.vercel.app` | Production URL |
| `RESEND_API_KEY` | *[nieuwe Resend key uit stap 1.1]* | Email service API key |
| `FROM_EMAIL` | `onboarding@resend.dev` | Email sender address |
| `NEXT_PUBLIC_APP_URL` | `https://portal-cvs.vercel.app` | Public app URL |
| `ANISSA_EMAIL` | `anissa@elmarservices.nl` | Admin user email |
| `ANISSA_PASSWORD` | `anissa123` | Admin default password |
| `REVIEWER_EMAIL` | `reviewer@elmarservices.nl` | Reviewer email |
| `REVIEWER_PASSWORD` | `reviewer123` | Reviewer default password |

**Let op**: Selecteer **"Production, Preview, and Development"** voor alle variables!

---

## ✅ **STAP 3: DEPLOY NAAR VERCEL**

### Optie A: Automatische Deploy (Recommended)
Je code staat al op GitHub. Vercel deploy automatisch na je push:
1. Ga naar Vercel dashboard
2. Kijk bij **Deployments** tab
3. Wacht tot de build compleet is (~2-3 minuten)
4. Status moet zijn: **"Ready"** ✅

### Optie B: Manually Trigger Deploy
Als automatische deploy niet werkt:
1. In Vercel dashboard, ga naar **Deployments**
2. Klik op **"Redeploy"** button
3. Selecteer **"Use existing Build Cache"** → **NO**
4. Klik **"Redeploy"**

---

## ✅ **STAP 4: SEED PRODUCTION DATABASE**

⚠️ **Doe dit ALLEEN als de database leeg is!**

### Methode 1: Via Vercel CLI (Makkelijkste)
```bash
cd /home/ayoub/Portal-cvs/portal
npx vercel env pull .env.production
npx tsx prisma/seed.ts
```

### Methode 2: Via Prisma Studio
```bash
cd /home/ayoub/Portal-cvs/portal
npx prisma studio
```
Voeg handmatig users en settings toe (zie USER_MANAGEMENT.md).

### Wat doet seeding?
- Maakt admin user: anissa@elmarservices.nl / anissa123
- Maakt reviewer user: reviewer@elmarservices.nl / reviewer123
- Maakt default settings entry

---

## ✅ **STAP 5: TEST DE APPLICATIE**

### 5.1 Test Login
1. Ga naar: https://portal-cvs.vercel.app/signin
2. Log in met: `anissa@elmarservices.nl` / `anissa123`
3. Je zou naar dashboard geleid moeten worden

### 5.2 Test Upload
1. Klik **"Upload"** in navbar
2. Upload een test CSV file
3. Check of file verschijnt in dashboard

### 5.3 Test Email Notifications
1. Ga naar **Settings**
2. Update reviewer email naar een test email
3. Upload een file
4. Check of je een email ontvangt

### 5.4 Test Review Process
1. Log uit en log in als reviewer
2. Klik op een upload in dashboard
3. Complete review met comments
4. Check of admin email notification werkt

---

## ✅ **STAP 6: BEVEILIG JE ACCOUNT**

### 6.1 Change Default Passwords
⚠️ **VERPLICHT!** De default passwords zijn onveilig.

Gebruik Prisma Studio of Neon dashboard:
```bash
# Generate new password hash
node -e "console.log(require('bcrypt').hashSync('NIEUWE_WACHTWOORD', 10))"

# Open Prisma Studio
npx prisma studio

# Update password in User table
```

Zie **USER_MANAGEMENT.md** voor gedetailleerde instructies.

### 6.2 Update Email Settings
1. Ga naar Settings in je app
2. Update uploader email naar je echte email
3. Update reviewer email naar echte reviewer email

---

## ✅ **VERIFICATION CHECKLIST**

Before calling it done, verify:

- [ ] Vercel deployment status = **"Ready"** ✅
- [ ] All environment variables set in Vercel (10 total)
- [ ] Can log in at portal-cvs.vercel.app
- [ ] Dashboard loads without errors
- [ ] Upload works (file appears in dashboard)
- [ ] Review process works (can add comments)
- [ ] Email notifications work (test with real email)
- [ ] Elmar logo appears in navbar
- [ ] Emails contain Elmar logo and correct link
- [ ] Default passwords changed to secure ones
- [ ] Exposed Resend API key deleted from Resend dashboard
- [ ] Neon database connection string reset

---

## 📋 **TROUBLESHOOTING**

### Build Failed in Vercel
- Check Vercel build logs
- Verify all environment variables are set
- Try redeploy without cache

### Can't Log In
- Verify DATABASE_URL is correct in Vercel
- Verify seed script ran successfully
- Check Neon database has User table with data

### No Email Notifications
- Verify RESEND_API_KEY is correct (new one from step 1.1)
- Verify FROM_EMAIL is set
- Check Resend dashboard for failed sends

### 500 Errors
- Check Vercel function logs
- Verify DATABASE_URL connection string is correct
- Verify all environment variables are set

---

## 🎉 **SUCCESS!**

Als alle checks ✅ zijn:
1. Je applicatie draait live op https://portal-cvs.vercel.app
2. Emails worden verstuurd met Elmar branding
3. Login credentials zijn veilig
4. Exposed secrets zijn geroteerd

**Je bent klaar!** 🚀

---

## 📚 **DOCUMENTATIE**

- **SETUP.md** - Technical deployment details
- **SECURITY_ROTATION.md** - Detailed secret rotation steps
- **USER_MANAGEMENT.md** - How to manage users via Neon
- **README.md** - General project information

---

**Need help?** Check the documentation files or ask me! 😊
