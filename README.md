# Shared Space

A private space for two people to keep notes, journals, reminders, and a shared calendar. Built as a Next.js app you can run locally or install as a PWA.

## Features

### Shared space for two

Create a space or join with an invite code. Each space holds at most two people. Notes and journal entries stay private until you share them; events live on the shared calendar.

### Home

The home screen greets you by time of day and shows upcoming and previous reminders and events, pinned notes, and recently updated notes and journal entries.

### Notes

Write with a rich editor (headings, bold, italic, underline, lists, checklists, quotes, and links). Autosave, pin, archive, tag, and restore earlier revisions. Share a note with your partner or keep it private.

### Journal

One entry per day, with date navigation and a “write today” shortcut. Entries can be tagged and shared the same way notes can. Shared entries show who wrote them.

### Calendar, events, and reminders

The month calendar marks days that have journal entries, reminders, or events.

- **Events** belong to the space (start/end time, optional description).
- **Reminders** can be personal or shared, with optional daily, weekly, monthly, or yearly recurrence.

A floating create button can start a note, today’s journal, a reminder, or an event.

### Search and shared feed

Search notes and journal entries by title, body, or tag, and filter by all / shared / private. The Shared page lists everything currently shared with your partner.

### Notifications

In-app notifications cover shared notes and journals, edits, due reminders, upcoming events, and when a member leaves. Optional web push, with separate toggles for shared content, reminders, and events.

### Offline and PWA

Install Shared Space as a standalone app. Note and journal drafts queue while you are offline and sync when you reconnect.

### Account and settings

Email/password accounts, profile name, timezone, light/dark/system theme, invite-code rotation (owner), and full account deletion.

Keyboard shortcuts: `n` creates a note, `/` opens search.

## Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- npm (or another Node package manager)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Prisma (DIRECT_URL can match DATABASE_URL for a local Postgres instance)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sharing?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/sharing?schema=public"

# NextAuth (generate with: openssl rand -base64 32)
AUTH_SECRET="replace-with-a-long-random-string"
AUTH_URL="http://localhost:3000"

# Optional: web push (npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:you@example.com"

# Optional: protect the notification dispatcher
CRON_SECRET="replace-with-a-long-random-string"
```

Push notifications and the `/api/cron/dispatch` job only work after you set the VAPID keys and `CRON_SECRET`. The rest of the app runs without them.

### 3. Apply the database schema

```bash
npx prisma migrate deploy
```

Prisma Client is generated automatically on `npm install` (`postinstall`) and again during `npm run build`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, then create a space or join with an invite code.

### Other commands

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm test           # Vitest unit tests
npm run test:e2e   # Playwright (starts the dev server if needed)
```

On Vercel, `vercel.json` schedules `GET /api/cron/dispatch` daily at 08:00 UTC. Send `Authorization: Bearer $CRON_SECRET` (or `?secret=`) so the job can dispatch reminder and event notifications.
