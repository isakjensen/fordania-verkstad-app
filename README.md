# Fordania Verkstad

Verkstadsplanerare för biluthyrning – byggd för Fordania. Appen hjälper
verkstadspersonalen hos biluthyrningsföretag att planera jobb, följa fordon och
hålla verkstaden i rörelse.

Plattformen är **multi-tenant** (varje kundföretag är en tenant), **multi-user**
(flera användare per tenant med olika roller) och har en separat **superadmin**
där Fordania hanterar alla anslutna kunder.

## Teknik

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev) för animationer
- [lucide-react](https://lucide.dev) för ikoner

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Struktur

```
src/
  app/
    (workshop)/        Verkstadsappen (tenant-vyn) – ljust skal
      page.tsx         Översikt/dashboard
      planering/ …     Övriga vyer
    superadmin/        Plattformsadmin – eget mörkt skal
  components/
    ui/                Designsystemets primitiver (Button, Card, Badge …)
    layout/            App-skal, sidomeny, toppbar, tenant-väljare
    dashboard/         Vyer för verkstadens översikt
    superadmin/        Vyer för plattformsadmin
  lib/                 Mockdata och hjälpfunktioner
```

## Status

Design och layout är på plats. Funktionalitet (inloggning, databas, riktig
data) kopplas på i nästa steg.
