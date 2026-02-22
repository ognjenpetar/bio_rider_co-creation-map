# Bio Rider Co-Creation Map

Interactive collaborative mapping web application for the Uzice-Sevojno region (Serbia). Citizens can add, explore, verify, discuss, and rate locations on a shared map - enabling participatory decision-making about the local environment.

## Features

### Core
- Interactive Leaflet map centered on Uzice-Sevojno region
- Location management with images, documents, and bilingual descriptions (SR/EN)
- Semantic search using PostgreSQL Full-Text Search
- Marker clustering for dense areas
- CSV and GeoJSON data export
- Bilingual UI (English + Serbian) with language switcher
- Responsive design (mobile + desktop)

### Collaboration & Participation
- **Comments & Ratings** - Users rate locations (1-5 stars) and leave comments
- **Location Verification** - Community members verify locations, earning a verified badge at 3+ verifications
- **Deliberative Discussions** - Structured deliberation system inspired by Pol.is/Loomio with 5 phases: Problem Identification -> Proposals -> Argumentation -> Consensus Building -> Closed
- **Notifications** - Real-time bell notifications for new locations, comments, verifications, and discussions
- **Share Links** - Copy shareable URL for any location with auto-zoom

### Advanced Map Features
- **Activity Heatmap** - Visualize location density with a green-to-red gradient heatmap layer
- **Routes & Polylines** - Create and display cycling, walking, hiking routes with distance calculation
- **Time Machine** - Slider to explore how the map evolved over time, with play/pause animation
- **Custom Markers** - SVG markers with status indicators (pulse for new, gold for top-rated, verified badge)
- **Layers Menu** - Toggle heatmap, routes, and time machine

### UI/UX
- **Animated Transitions** - Smooth page and panel transitions with Framer Motion
- **Interactive Statistics** - Dashboard with Recharts (BarChart, AreaChart, PieChart)
- **Onboarding Tour** - Step-by-step walkthrough for new users (React Joyride)
- **Responsive Split-Screen** - Animated side panels for locations list and forms
- **Skeleton Loaders** - Loading placeholders for better perceived performance

### Authentication
- localStorage-based authentication (simple username entry)
- Admin role with password protection
- Role-based permissions (admin vs regular user)

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet + react-leaflet + react-leaflet-cluster + leaflet.heat
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Onboarding:** React Joyride
- **Backend:** Supabase (PostgreSQL + Storage)
- **Internationalization:** react-i18next
- **Deployment:** GitHub Pages

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

## Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/ognjenpetar/bio_rider_co-creation-map.git
cd bio_rider_co-creation-map
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API

### 3. Set Up Database

Run the SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/20240101000000_create_tables.sql` - Core tables
2. `supabase/migrations/20240101000001_create_rls_policies.sql` - Security policies
3. `supabase/migrations/20240101000002_create_search_functions.sql` - Search functions
4. `supabase/migrations/20240103000000_add_localStorage_auth.sql` - localStorage auth
5. `supabase/migrations/20240104000000_add_comments_and_multilang.sql` - Comments & multilingual
6. `supabase/migrations/20240105000000_add_verifications_routes_deliberations_notifications.sql` - Verifications, routes, deliberations, notifications

### 4. Create Storage Buckets

In Supabase Dashboard > Storage:

1. Create bucket `location-images` (Public, 5MB limit)
2. Create bucket `location-documents` (Private, 20MB limit)

### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment

### GitHub Pages (Automatic)

1. Add secrets in repository Settings > Secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Go to Settings > Pages > Source: "GitHub Actions"
3. Push to `main` to trigger deployment

### Manual Build

```bash
npm run build
# Built files in dist/
```

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin panel
│   ├── auth/           # Login screen
│   ├── common/         # Header, LanguageSwitcher, PageTransition, OnboardingTour, SkeletonLoader
│   ├── locations/      # LocationForm (bilingual)
│   ├── map/            # MapContainer, LocationMarkers, MarkerPopup, HeatmapLayer,
│   │                   # RouteLayer, RouteCreator, TimeMachineSlider, VerificationBadge,
│   │                   # DeliberationPanel, NotificationBell, LocationComments, StarRating,
│   │                   # LocationsList, customMarkerIcon
│   └── search/         # SearchBar, SearchResults
├── contexts/           # AuthContext, MapContext
├── hooks/              # useLocations, useSearch
├── lib/
│   ├── api/            # locations, comments, verifications, routes, deliberations, notifications
│   ├── export.ts       # CSV & GeoJSON export
│   ├── i18n.ts         # i18n configuration
│   └── supabase.ts     # Supabase client
├── locales/            # en.json, sr.json
├── pages/              # MapPage, StatsPage, AdminPage, LoginPage
└── types/              # TypeScript interfaces
```

## Database Tables

| Table | Description |
|-------|-------------|
| `locations` | Map locations with bilingual descriptions |
| `location_images` | Image files linked to locations |
| `location_documents` | Document files with text extraction |
| `location_comments` | User comments with 1-5 star ratings |
| `location_verifications` | Community verification votes |
| `routes` | Cycling/walking/hiking routes (polylines) |
| `deliberations` | Structured discussions per location |
| `deliberation_entries` | Entries within deliberations |
| `deliberation_votes` | Up/down votes on entries |
| `notifications` | User notifications |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
