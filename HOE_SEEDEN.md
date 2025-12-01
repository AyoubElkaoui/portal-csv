# 🚀 HOE SEED JE IN VERCEL/NEON? (3 OPTIES)

## OPTIE 1: VIA VERCEL CLI (MAKKELIJKSTE!) ✅

**Stap 1:** Install Vercel CLI (1x)
```bash
npm i -g vercel
```

**Stap 2:** Login
```bash
vercel login
```

**Stap 3:** Haal productie environment variables op
```bash
cd /home/ayoub/Portal-cvs/portal
vercel env pull .env.production
```

**Stap 4:** Seed de productie database
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx tsx prisma/seed.ts
```

**KLAAR!** Je users zijn aangemaakt in productie! 🎉

---

## OPTIE 2: DIRECT IN NEON SQL EDITOR

**Stap 1:** Ga naar https://console.neon.tech/

**Stap 2:** Selecteer je project: **ep-green-art-ag6od1nb**

**Stap 3:** Klik op **"SQL Editor"**

**Stap 4:** Genereer bcrypt hash (in terminal):
```bash
node -e "console.log(require('bcrypt').hashSync('anissa123', 10))"
```
Kopieer de output (bijv: `$2b$10$xyz...`)

**Stap 5:** Plak deze SQL in de editor:
```sql
-- Insert users
INSERT INTO "User" (email, name, role, password)
VALUES 
  ('anissa@elmarservices.nl', 'Anissa', 'uploader', '$2b$10$PLAK_HASH_HIER'),
  ('reviewer@elmarservices.nl', 'Reviewer', 'reviewer', '$2b$10$PLAK_HASH_HIER')
ON CONFLICT (email) DO NOTHING;

-- Insert settings
INSERT INTO "Settings" (id, "uploaderEmail", "reviewerEmail")
VALUES ('default', 'anissa@elmarservices.nl', 'reviewer@elmarservices.nl')
ON CONFLICT (id) DO NOTHING;
```

**Stap 6:** Klik **"Run query"**

**KLAAR!** 🎉

---

## OPTIE 3: VIA PRISMA STUDIO

**Stap 1:** Zet je productie DATABASE_URL tijdelijk in je lokale .env:
```bash
# In .env - even de productie URL erin
DATABASE_URL="postgresql://...jouw-neon-productie-url..."
```

**Stap 2:** Open Prisma Studio:
```bash
npx prisma studio
```

**Stap 3:** Klik op **"User"** tabel → **"Add record"**

**Stap 4:** Vul in:
- email: `anissa@elmarservices.nl`
- name: `Anissa`
- role: `uploader`
- password: Genereer hash met:
  ```bash
  node -e "console.log(require('bcrypt').hashSync('anissa123', 10))"
  ```
  Plak de hash!

**Stap 5:** Herhaal voor reviewer

**Stap 6:** Klik op **"Settings"** tabel → **"Add record"**
- id: `default`
- uploaderEmail: `anissa@elmarservices.nl`
- reviewerEmail: `reviewer@elmarservices.nl`

**Stap 7:** Save en sluit Prisma Studio

**KLAAR!** 🎉

---

## WELKE OPTIE KIEZEN?

| Optie | Moeilijkheid | Snelheid | Aanbevolen |
|-------|--------------|----------|------------|
| 1. Vercel CLI | 😊 Makkelijk | ⚡ Snel | ✅ **JA!** |
| 2. Neon SQL | 🤔 Medium | ⚡ Snel | 👌 Ook goed |
| 3. Prisma Studio | 😊 Makkelijk | 🐢 Langzaam | ⚠️ Tijdelijk |

**MIJN ADVIES:** Gebruik **Optie 1** (Vercel CLI) - het snelst en makkelijkst!

---

## NA SEEDING:

1. Ga naar: https://portal-cvs.vercel.app/signin
2. Log in met:
   - Email: `anissa@elmarservices.nl`
   - Wachtwoord: `anissa123`
3. Ga naar **Settings**
4. Wijzig je email en wachtwoord!
5. Klaar! 🎉

---

## TROUBLESHOOTING

**"Command not found: vercel"**
```bash
npm i -g vercel
```

**"No such file: .env.production"**
```bash
cd /home/ayoub/Portal-cvs/portal
vercel env pull .env.production
```

**"User already exists"**
- Perfect! Dan is ie al geseeded
- Log gewoon in met anissa@elmarservices.nl / anissa123

**"Can't connect to database"**
- Check of DATABASE_URL correct is in Vercel
- Check of je IP whitelisted is in Neon (of zet op "Allow all")

---

**Geen zin om te kiezen? Run dit:** 👇

```bash
# Alles in 1x:
cd /home/ayoub/Portal-cvs/portal && \
vercel login && \
vercel env pull .env.production && \
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx tsx prisma/seed.ts && \
echo "✅ KLAAR! Log in op portal-cvs.vercel.app"
```

DONE! 🚀
