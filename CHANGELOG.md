# Changelog - Portal CVS Updates

## 1 December 2025

### 🎯 Belangrijke Verbeteringen

#### 1. **Één Upload/Review Tegelijk + Automatisch Verwijderen**
- ✅ Uploader (Anissa) kan maar 1 bestand tegelijk uploaden
- ✅ Reviewer kan maar 1 bestand tegelijk reviewen
- ✅ Upload wordt **automatisch verwijderd** na download door Anissa
- ✅ Upload verdwijnt bij reviewer zodra deze is gereviewed
- ✅ Upload verschijnt alleen bij Anissa als status = 'reviewed' (klaar voor download)
- ✅ Upload pagina blokkeert nieuwe uploads als er al een bestand in behandeling is

#### 2. **Email Configuratie in Database**
- ✅ Nieuwe `Settings` tabel in database toegevoegd
- ✅ Email adressen zijn nu configureerbaar via de Settings pagina
- ✅ Twee email velden:
  - **Uploader Email** (Anissa) - ontvangt notificatie als review klaar is
  - **Reviewer Email** - ontvangt notificatie als nieuwe upload beschikbaar is
- ✅ Emails worden dynamisch uit database gehaald (geen hardcoded emails meer)
- ✅ Settings worden persistent opgeslagen in PostgreSQL database

#### 3. **Veel Overzichtelijkere Interface**
- ✅ Duidelijke instructie banners op dashboard
- ✅ Verschillende kleuren en iconen voor uploader vs reviewer
- ✅ Grote kaarten in plaats van kleine grid items
- ✅ Waarschuwingen als er al een upload in behandeling is
- ✅ Status badges met emojis (✓ Gereviewed, ⏳ Wacht op Review)
- ✅ Duidelijke teksten over wat er gebeurt na download (automatisch verwijderen)

#### 4. **Download Formaten - Excel & PDF**
- ✅ PDF download was al geïmplementeerd en werkt perfect
- ✅ Excel (.xlsx) download beschikbaar
- ✅ Duidelijke keuze tussen beide formaten op download pagina
- ✅ Extra labels: "Bewerkbaar formaat" (Excel) en "Clean & professioneel" (PDF)

#### 5. **Verbeterde Email Notificaties**
- ✅ Email naar reviewer bij nieuwe upload
- ✅ Email naar uploader wanneer review voltooid is
- ✅ Waarschuwing in email: "Het bestand wordt automatisch verwijderd zodra je het hebt gedownload"
- ✅ Confirmation email naar uploader na succesvolle upload

### 📁 Gewijzigde Bestanden

#### Database
- `prisma/schema.prisma` - Settings model toegevoegd
- `prisma/seed.ts` - Seed script voor default settings
- `prisma/migrations/20251201092709_add_settings_table/` - Nieuwe migration

#### API Routes
- `src/app/api/settings/reviewer-email/route.ts` - Settings opslaan/ophalen
- `src/app/api/upload/route.ts` - Email adressen uit database halen
- `src/app/api/review/[id]/route.ts` - Email adressen uit database + waarschuwing
- `src/app/api/download/[id]/route.ts` - **Automatisch verwijderen na download**

#### Pages
- `src/app/dashboard/page.tsx` - Overzichtelijkere UI, 1 upload tegelijk, instructies
- `src/app/settings/page.tsx` - Twee email velden (uploader + reviewer)
- `src/app/upload/page.tsx` - Blokkeren als bestand in behandeling
- `src/app/download/[id]/page.tsx` - Duidelijkere instructies en labels

### 🚀 Hoe te Gebruiken

#### Voor Uploader (Anissa):
1. Log in op het systeem
2. Upload een CSV/Excel bestand via Upload pagina
3. Wacht op email notificatie wanneer review klaar is
4. Download het gereviewde bestand vanaf Dashboard
5. **Let op:** Bestand wordt automatisch verwijderd na download
6. Nu kun je een nieuw bestand uploaden

#### Voor Reviewer:
1. Log in op het systeem
2. Ontvang email notificatie bij nieuwe upload
3. Review het bestand via Dashboard
4. Markeer rijen als goedgekeurd of met problemen
5. Bestand verdwijnt automatisch na je review
6. Nu kun je een volgend bestand reviewen

#### Voor Beheerder:
1. Ga naar Settings pagina
2. Stel de juiste email adressen in:
   - Uploader Email (Anissa's email)
   - Reviewer Email (reviewer's email)
3. Klik op "Opslaan"
4. Emails worden nu automatisch naar deze adressen gestuurd

### 🔧 Technische Details

**Database Schema:**
```prisma
model Settings {
  id             String   @id @default(cuid())
  uploaderEmail  String   @default("anissa@example.com")
  reviewerEmail  String   @default("reviewer@example.com")
  updatedAt      DateTime @updatedAt
}
```

**Workflow:**
1. Anissa upload → Email naar reviewer → Reviewer krijgt email
2. Reviewer reviewt → Email naar Anissa → Anissa krijgt email
3. Anissa download → **Upload automatisch verwijderd** → Kan opnieuw uploaden

### ✅ Voltooid
- [x] 1 upload/review per keer
- [x] Automatisch verwijderen na download
- [x] Configureerbare email adressen
- [x] Overzichtelijke interface met instructies
- [x] Excel en PDF download ondersteuning
- [x] Duidelijke status indicators
- [x] Waarschuwingen bij pending uploads

### 📝 Notes
- Database migrations zijn succesvol toegepast
- Seed data is toegevoegd voor default settings
- Build succesvol zonder errors
- Alle TypeScript types zijn correct
