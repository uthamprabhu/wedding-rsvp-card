# Farzeen & Bilal — Wedding Invitation

A luxury Muslim wedding invitation and RSVP system, built with Next.js 16 and Supabase.

**Live:** [farzeen-bilal.vercel.app](https://farzeen-bilal.vercel.app/)

## ✨ Features

### Guest Experience

- **Treasure chest opening** — a 3D chest (react-three-fiber / Three.js) that guests tap or shake open to reveal the invitation, with a CSS-only fallback for devices without WebGL
- **Luxury digital invitation** — cream/burgundy Mughal-inspired design, couple portraits, family invitation, countdown to the big day, save-the-date
- **Interactive itinerary** — the three wedding events (Fabi Mehandi, Haldi & Sangeeth, The Fabi Big Day) with dates, venue and map
- **RSVP form** — name, phone, email, day-attendance selector, party size, accommodation, all validated with Zod on both client and server
- **Duplicate-entry protection** — a phone number can only RSVP once
- **Confirmation page** — recaps exactly what was submitted, including which days the guest is attending
- **Slide-to-confirm** — an accessible (keyboard + screen-reader operable), swipe-to-submit control instead of a plain button
- **Background music** — one persistent audio instance across the whole site, autoplay-on-gesture, on/off toggle, remembers the guest's choice
- **Ambient effects** — WebGL butterflies and lantern/particle backdrops, all GPU-conscious and paused when off-screen or the tab is hidden
- **PWA installable** — add-to-home-screen on Android/iOS/desktop, custom generated icons and manifest
- **Fully responsive** — mobile-first, with dedicated layouts for tablet and desktop

### Admin Panel

- **Secure login** — password-protected, HttpOnly session cookie, middleware-enforced route protection
- **Dashboard stats** — total responses, total guests, accommodation needed, average party size, responses in the last 7 days
- **Per-event attendance** — guest counts and response counts broken down by each of the three wedding days
- **Filtering** — search by name/phone/email, filter by accommodation need, filter by which day(s) a guest is attending (match *any* or *all* selected days), sort by date/name/guest count
- **Responsive table/cards** — full table on desktop, comfortable card layout on tablet and mobile
- **Streaming + skeletons** — dashboard data streams in behind a themed loading skeleton; a dedicated error boundary with retry on failure

## 🛠️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) — page/element animation
- [Three.js](https://threejs.org/) + [react-three-fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) — the treasure chest and butterflies
- [@tsparticles](https://particles.js.org/) — ambient sparkle/decor particles
- [@paper-design/shaders-react](https://www.npmjs.com/package/@paper-design/shaders-react) — the paper-texture background shader
- [Zod](https://zod.dev/) — form and API validation
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth scrolling
- [Lucide React](https://lucide.dev/) — icons

**Backend / Data**
- [Supabase](https://supabase.com/) (PostgreSQL) — RSVP storage, service-role key for admin queries
- Next.js Route Handlers — `/api/rsvp/submit`, `/api/admin/login`, `/api/admin/logout`
- Next.js Middleware — admin route protection

**Fonts**
- Cormorant Garamond (`next/font/google`) — editorial headings
- Geist Sans / Geist Mono (`next/font/google`) — UI, labels, body copy
- Brittany Signature (self-hosted WOFF2) — the couple's names, used sparingly

**Analytics & Tooling**
- [@vercel/analytics](https://vercel.com/docs/analytics) — pageview analytics (active once deployed on Vercel)
- ESLint 9 (flat config) + TypeScript strict mode

## 📦 Installation

```bash
git clone <your-repo-url>
cd wedding-rsvp-card

npm install

# Copy and fill in your own values
cp .env.local.example .env.local   # or create .env.local manually — see below

npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the production build
npm run lint      # ESLint
```

## 🔑 Environment Variables

Create `.env.local` in the project root:

```env
# Supabase — public, safe to expose client-side
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Supabase — server-side only, never expose this
SUPABASE_SECRET_KEY=your_service_role_key

# Admin panel password
ADMIN_PASSWORD=your_secure_password
```

## 🗄️ Database Schema

Run in the Supabase SQL editor:

```sql
create table if not exists public.rsvps (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null unique,                 -- one RSVP per phone number
  email text,
  guest_count integer not null check (guest_count between 1 and 10),
  accommodation_needed boolean not null default false,
  days_attending text[] not null default '{}', -- e.g. {day1,day3}
  created_at timestamp with time zone default now()
);

create index if not exists idx_rsvps_created_at on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;

grant all on public.rsvps to service_role;
grant all on public.rsvps to postgres;
grant insert on public.rsvps to anon;
```

`days_attending` stores canonical ids (`day1`, `day2`, `day3`) mapped to real event names/dates in `lib/wedding-days.ts` — the single source of truth used by both the RSVP form and the admin dashboard.

## 🚀 Deployment (Vercel)

```bash
git add .
git commit -m "Deploy"
git push origin main
```

1. Import the repo at [vercel.com](https://vercel.com)
2. Add the four environment variables from `.env.local` in **Project Settings → Environment Variables**
3. Deploy

Live at **[farzeen-bilal.vercel.app](https://farzeen-bilal.vercel.app/)**.

## 📱 Routes

| Route | Description | Access |
|---|---|---|
| `/` | Treasure chest → invitation landing | Public |
| `/itinerary` | Wedding events timeline | Public |
| `/rsvp` | RSVP form | Public |
| `/rsvp/confirmation` | Submission confirmation | Public |
| `/admin` | Admin login | Public (form only) |
| `/admin/dashboard` | RSVP management | Protected (middleware) |
| `/api/rsvp/submit` | RSVP submission endpoint | Public POST |
| `/api/admin/login` | Admin auth | Public POST |
| `/api/admin/logout` | Admin session clear | Protected POST |

## 🎨 Theme

**Colors**
- Background (cream): `#ebe1d6`
- Gold accent: `#a6814e`
- Ink / body text: `#433b34`
- Deep burgundy (invitation cover): `#3A0712`

**Typography**
- Headings: Cormorant Garamond
- Body / UI: Geist Sans
- Names (accent only): Brittany Signature

**Icons & PWA**
- `app/icon.tsx` / `app/apple-icon.tsx` — generated F&B monogram favicon and Apple touch icon (`next/og`)
- `app/opengraph-image.tsx` — generated Open Graph share card, no static image needed
- `app/manifest.ts` — PWA manifest for install-to-home-screen

## ⚡ Performance Notes

- Images served as WebP/AVIF via `next/image`, sized per breakpoint
- Heavy components (`TreasureChestScene`, `RealisticButterflies`, particle backdrops) are dynamically imported and deferred past first paint
- The chest's WebGL canvas is sized to fit its full animation envelope (not just the resting chest) — nothing clips off-frustum, and a smaller canvas footprint means less fragment shading, not more
- `frameloop="demand"` + capped device pixel ratio on all Three.js canvases
- Ambient effects pause via `IntersectionObserver` / `visibilitychange` when off-screen or the tab is hidden
- Route-level skeleton loaders (`loading.tsx`) and streamed Suspense boundaries on the admin dashboard
- Self-hosted fonts with `font-display: swap` and a `<link rel="preload">` for the signature font

## 🔒 Security Notes

- RSVP submissions are validated with Zod on both the client (fast feedback) and the server (source of truth) — the server never trusts client input
- Duplicate phone numbers are rejected both at the application layer and via a database unique constraint (belt-and-braces against race conditions)
- Admin session is an HttpOnly, SameSite cookie; the dashboard route is gated by `middleware.ts`, not just a client-side check
- The Supabase service-role key is used server-side only and is never sent to the browser
- Search input on the admin dashboard is sanitized before being interpolated into a PostgREST filter string

## 🐛 Troubleshooting

**RSVP submission fails** — confirm `SUPABASE_SECRET_KEY` is set, the `rsvps` table exists with the schema above, and the `days_attending` column exists (older tables created before this feature will need it added via `alter table`).

**Admin login fails** — confirm `ADMIN_PASSWORD` is set in the environment actually running the app (not just `.env.local` if deployed), and clear cookies if a stale session is stuck.

**Music doesn't autoplay** — expected browser behaviour. Autoplay without a prior gesture is blocked by Chrome/Safari; the first tap anywhere on the page (including opening the chest) unlocks it. The toggle always reflects the real playback state, not just intent.

**Treasure chest / butterflies don't render** — check the browser console for WebGL errors. Devices without WebGL automatically get the CSS-only chest fallback; there's no butterfly fallback, they simply don't render (harmless).

**Build fails with a CSS parse error mentioning `@layer`** — check `app/globals.css` for a UTF-8 BOM at the top of the file; some editors/tools reintroduce it. Strip it and rebuild.

## 📄 License

Private project — built for Farzeen & Bilal's wedding. Not for reuse or redistribution.

---

Made with ♥ by [UNSP](https://wa.me/919633693160)
