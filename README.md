# YuGo Eats

A couples' food ordering app built for Hugo and Yuge. Browse a shared menu, add dishes to a real-time shared cart, place orders, leave reviews, and track fun stats together.

## Features

- **Shared Menu** — Browse dishes with photos, spice levels, prep times, ratings, and Chef's Pick recommendations
- **Search & Sort** — Search dishes by name/description, sort by price, rating, prep time, or popularity
- **Shared Cart** — Both users see the same cart in real time with colored tags showing who added what
- **Order Tracking** — Place orders and follow their status (pending, cooking, ready, completed)
- **Reviews** — Both users can rate and comment on dishes after completing an order
- **Stats Dashboard** — Days together counter, per-person favorites, spice tolerance trend graph, dish leaderboard, and orders-by-day chart
- **Admin Panel** — Manage dishes (CRUD + photo upload), orders, reviews, users, and settings behind a password
- **Device Fingerprinting** — Automatic role detection with per-device lockdown in production
- **Haptic Feedback** — Vibration (Android) and audio click (iOS/all platforms) on key actions
- **SMS Notifications** — Optional Twilio integration for new order alerts
- **PWA Ready** — Installable as a home screen app with safe area support

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, standalone output)
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/)
- **UI**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) (auto WebP conversion + thumbnails)
- **Deployment**: Docker (multi-stage build, Alpine)

## Getting Started

### Docker (recommended)

```bash
docker compose up --build -d
```

The app starts at [http://localhost:3000](http://localhost:3000). An admin password is generated on first run — check the logs:

```bash
docker compose logs | grep "Admin password"
```

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DEV_MODE` | Show dev role switcher bar | `true` |
| `DATABASE_PATH` | SQLite database file path | `./data/yugo-eats.db` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (optional) | — |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (optional) | — |
| `TWILIO_PHONE_NUMBER` | Twilio sender number (optional) | — |
| `HUGO_PHONE_NUMBER` | Hugo's phone for notifications (optional) | — |

## Data Persistence

Docker volumes keep data across rebuilds:

- `yugo-data` — SQLite database (orders, reviews, users, settings)
- `yugo-uploads` — Uploaded dish and review photos

Only `docker compose down -v` deletes volumes. Normal rebuilds preserve all data.

## Project Structure

```
src/
├── app/
│   ├── admin/         # Admin login + dashboard
│   ├── api/           # REST API routes
│   │   ├── auth/      # Device fingerprint auth
│   │   ├── cart/      # Shared cart CRUD
│   │   ├── config/    # Runtime config (dev mode)
│   │   ├── dishes/    # Menu CRUD
│   │   ├── orders/    # Order lifecycle
│   │   ├── reviews/   # Review CRUD
│   │   ├── stats/     # Analytics queries
│   │   └── upload/    # Image upload + processing
│   ├── menu/          # Menu browsing
│   ├── orders/        # Orders + reviews (merged view)
│   └── stats/         # Stats dashboard
├── components/
│   ├── cart/          # Cart drawer
│   ├── menu/          # Dish cards + detail sheet
│   ├── orders/        # Order cards
│   └── shared/        # Bottom nav, dev switcher
├── hooks/             # Auth + cart hooks
└── lib/
    ├── db/            # Schema + database init
    ├── haptics.ts     # Cross-platform haptic feedback
    └── images.ts      # Sharp image processing
```
