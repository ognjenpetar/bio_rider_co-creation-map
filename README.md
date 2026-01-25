# Bio Rider Co-Creation Map

Interactive map web application for the Užice-Sevojno area (Serbia) with user-generated locations, role-based access control, and semantic search capabilities.

## Features

- Interactive map centered on Užice-Sevojno region
- Google OAuth authentication
- Role-based access control (superadmin, admin, editor, viewer)
- Location management with images and documents
- Semantic search using PostgreSQL Full-Text Search
- Edit suggestions workflow for viewers
- Admin panel for user and content management
- Bilingual UI (English + Serbian)
- Responsive design (mobile + desktop)

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet + react-leaflet
- **Backend:** Supabase (Auth, Database, Storage)
- **Internationalization:** react-i18next
- **Deployment:** GitHub Pages

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Google Cloud Console project (for OAuth)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ognjenpetar/bio_rider_co-creation-map.git
cd bio_rider_co-creation-map
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API

### 4. Set Up Database

Run the SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/20240101000000_create_tables.sql`
2. `supabase/migrations/20240101000001_create_rls_policies.sql`
3. `supabase/migrations/20240101000002_create_search_functions.sql`

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:5173` (for local development)
5. In Supabase Dashboard:
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Add your Google Client ID and Client Secret

### 6. Create Storage Buckets

In Supabase Dashboard > Storage:

1. Create bucket `location-images`:
   - Public bucket: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

2. Create bucket `location-documents`:
   - Public bucket: No
   - File size limit: 20MB
   - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

### 7. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment to GitHub Pages

### Automatic Deployment

The project includes a GitHub Actions workflow that automatically deploys on push to `main`.

1. Go to your repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
3. Go to Settings > Pages
4. Set Source to "GitHub Actions"
5. Push to `main` branch to trigger deployment

### Manual Deployment

```bash
npm run build
```

The built files will be in the `dist` directory.

## User Roles

| Role | Permissions |
|------|-------------|
| `superadmin` | Full control - manage users, locations, approve suggestions, change roles |
| `admin` | Manage content - approve/reject suggestions, moderate locations |
| `editor` | Create and edit locations, upload files |
| `viewer` | View map, submit edit suggestions (require approval) |

**Note:** The email `ognjenpetar@gmail.com` is automatically assigned the `superadmin` role.

## Project Structure

```
src/
├── components/
│   ├── admin/        # Admin panel components
│   ├── auth/         # Authentication components
│   ├── common/       # Shared UI components
│   ├── locations/    # Location-related components
│   ├── map/          # Map components
│   └── search/       # Search components
├── contexts/         # React contexts (Auth, Map)
├── hooks/            # Custom React hooks
├── lib/
│   ├── api/          # API functions
│   ├── i18n.ts       # i18n configuration
│   └── supabase.ts   # Supabase client
├── locales/          # Translation files
├── pages/            # Page components
└── types/            # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Adding New Translations

1. Add keys to `src/locales/en.json` and `src/locales/sr.json`
2. Use in components: `const { t } = useTranslation(); t('key.path')`

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
