# SFF Lead Radar

**ShortFormFactory Lead Finder** - A comprehensive web application for finding, qualifying, pitching, and tracking video editing leads.

## Features

- 🔍 **Automated Lead Discovery** via Bing Web Search API
- 🎯 **Deterministic Scoring System** (0-100) with buyer/seller filters
- 🏷️ **Smart Categorization** by buyer type, pain points, and service match
- 📊 **Lead Pipeline Management** with status tracking
- 💬 **DM Template System** with auto-selection and placeholder fills
- 📅 **Follow-up Automation** with scheduling and reminders
- 🔗 **UTM Link Generation** for tracking conversions
- 📈 **CSV Export** for external analysis

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth with email magic links
- **Styling**: Tailwind CSS
- **API**: Bing Web Search API v7

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted like Neon/Supabase)
- Bing Web Search API key ([Get one here](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api))
- SMTP server for email magic links (or use a service like SendGrid, Resend, etc.)

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd SFF-Lead-Radar-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sff_lead_radar?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"  # Run: openssl rand -base64 32

# Email Provider (for magic links)
EMAIL_SERVER="smtp://user:password@smtp.example.com:587"
EMAIL_FROM="noreply@yourdomain.com"

# Bing Web Search API
BING_SEARCH_API_KEY="your-bing-api-key-here"
BING_SEARCH_ENDPOINT="https://api.bing.microsoft.com/v7.0/search"
```

### 4. Set Up the Database

Push the Prisma schema to your database:

```bash
npm run db:push
```

Seed the database with default query templates and DM templates:

```bash
npm run db:seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project" and import your GitHub repository
3. Configure environment variables in the Vercel dashboard (same as `.env`)
4. Deploy

### 3. Set Up Production Database

Use a hosted PostgreSQL service:
- **Neon** ([neon.tech](https://neon.tech)) - Recommended, free tier available
- **Supabase** ([supabase.com](https://supabase.com))
- **Railway** ([railway.app](https://railway.app))

Update `DATABASE_URL` in Vercel environment variables.

### 4. Run Database Migrations

After deployment, run migrations via Vercel CLI or dashboard:

```bash
vercel env pull .env.local
npm run db:push
npm run db:seed
```

## Usage Guide

### 1. First Sign-In

- Navigate to your app URL
- Enter your email
- Click the magic link sent to your email
- You'll be redirected to the dashboard

### 2. Configure Settings

Go to **Settings** and configure:
- **Order Page URL**: Your money page/order form
- **UTM Parameters**: For tracking (source, medium)
- **Rate Limits**: Max results per run, daily query limits, cooldown
- **Job Board Blocklist**: Additional sites to exclude (upwork, fiverr are always blocked)
- **Follow-up Timing**: FU1 and FU2 delay hours

### 3. Run a Search

Go to **Run Search**:
1. Select a **Query Template** (e.g., "Master (Balanced)", "Podcast Repurpose")
2. Choose a **Source Pack**:
   - **Wide Web**: No site constraints
   - **Forums**: Reddit, Quora
   - **Social**: X (Twitter), Facebook
   - **Professional**: LinkedIn, Medium
3. Select **Market**: US or Canada
4. Choose **Freshness**: Past Day, Week, or Month
5. Click **Run Search**

Results will be automatically:
- Deduped (canonical URLs)
- Scored (0-100)
- Categorized (Outreach Ready ≥70, Review 40-69, Rejected <40)
- Seller posts and job boards are auto-rejected

### 4. Review Leads in Inbox

Go to **Leads Inbox**:
- View leads by status tabs
- Bulk actions: Mark Contacted, Reject, Export CSV
- Sort by score or newest

### 5. Use the Lead Detail Page

Click any lead to:
- View full details (URL, title, snippet, score breakdown)
- See pain tags and buyer type
- Copy DM/Follow-up templates (auto-filled with placeholders)
- Copy UTM tracking link
- Mark outreach actions (DM sent, FU1/FU2 sent, Replied, Booked, Won/Lost)
- Add notes

### 6. Follow-Up Reminders

Go to **Today Queue**:
- See all leads with follow-ups due today
- Quick actions: Copy FU1/FU2, Mark Followed Up, Mark Replied

### 7. Manual Search Fallback

If Bing API fails or you want to manually search:
1. Go to **Run Search** → **Manual Search** tab
2. Use the Golden Template Builder to copy a search query
3. Run it manually on Google/Bing/Reddit
4. Paste URLs (up to 50) into the import field
5. Leads will be deduped and added to your inbox

## Database Schema

### Core Tables

- **users**: User accounts (NextAuth)
- **settings**: Per-user settings (order page, UTM, rate limits, etc.)
- **queries**: Saved query templates (Master + 16 categories)
- **runs**: Search execution logs
- **leads**: Lead records with scoring, status, and metadata
- **lead_events**: Audit log for all lead actions
- **templates**: DM/Follow-up message templates

### Key Enums

- **LeadStatus**: OUTREACH_READY, REVIEW, REJECTED, CONTACTED, REPLIED, BOOKED, WON, LOST
- **BuyerType**: AGENCY, PODCASTER, COACH, ECOM, CREATOR, UNKNOWN
- **MappedService**: AI_REEL_EDIT, SOCIAL_MEDIA_EDIT, VIRAL_CAPTIONS, PODCAST_YOUTUBE_REPURPOSE, etc.
- **SourcePack**: FORUMS, SOCIAL, PROFESSIONAL, WIDE_WEB

## API Endpoints

- `POST /api/search/run` - Execute a Bing search
- `GET/POST /api/settings` - Get/update user settings
- `GET /api/queries` - List query templates
- `GET /api/leads` - List leads (with filters)
- `GET /api/leads/[id]` - Get lead detail
- `PATCH /api/leads/[id]` - Update lead (status, notes, etc.)

## Scoring Algorithm

Leads are scored deterministically (0-100):

**High Intent** (+25): "hiring", "looking for", "need an editor", "video editor needed"
**Urgency** (+15): "deadline", "ASAP", "urgent", "rush", "swamped", "overwhelmed"
**Agency/Overflow** (+10): "agency", "white label", "client", "overflow"
**Podcast/Repurpose** (+10): "podcast", "repurpose", "clips", "highlights"
**Short-form** (+10): "shorts", "reels", "tiktok", "short form"
**CapCut** (+5): "capcut"

**Auto-Reject**:
- Seller patterns: "[for hire]", "portfolio link", "my rates", etc.
- Job boards: upwork, fiverr, freelancer, peopleperhour

**Qualification**:
- **≥70**: Outreach Ready
- **40-69**: Review
- **<40**: Rejected

## Template System

DM/Follow-up templates support placeholders:
- `{turnaround}`: "48-hour" or "12-hour rush available"
- `{service}`: Mapped service name
- `{buyer_type}`: agency, podcaster, coach, etc.
- `{pain_1}`, `{pain_2}`: Top pain tags
- `{order_link}`: Order page URL with UTM params
- `{platform}`: "short-form"
- `{offer_angle}`: "fixed-price", "fast 48-hour", etc.

Templates are auto-selected based on lead attributes (buyer type, service, offer angle, priority).

## Troubleshooting

### "Unauthorized" errors
- Make sure you're signed in
- Check that `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if local)
- Run `npm run db:push` to sync schema

### Bing API errors
- Check that `BING_SEARCH_API_KEY` is valid
- Verify you haven't hit rate limits
- Check Bing API quota in Azure portal

### Email magic links not working
- Verify `EMAIL_SERVER` and `EMAIL_FROM` are correct
- Check spam folder
- Try a different email provider (Resend, SendGrid)

## Contributing

This is a private tool for ShortFormFactory. If you want to customize it for your use case, fork the repository.

## License

ISC

## Support

For issues or questions, contact anthony@shortformfactory.com
