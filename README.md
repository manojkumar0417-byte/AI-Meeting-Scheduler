# AI Real-Time Meeting Scheduler

Standalone Next.js project for Windows PowerShell. It uses:
- Google OAuth 2.0 to connect a user's Google account
- Google Calendar FreeBusy API to check real availability
- Google Calendar Events API to create an actual calendar event
- Local Ollama (`llama3.2:1b`) to turn a natural-language request into a meeting title and duration

## 1. Prerequisites
- Node.js 20.9+ recommended
- npm
- Google account
- Ollama installed locally

## 2. Install

```powershell
npm install
Copy-Item .env.example .env.local
```

Fill in `.env.local` with your Google OAuth client ID and secret. Create a random session password:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copy the result into `SESSION_PASSWORD`.

## 3. Google Calendar setup
1. Open https://console.cloud.google.com/
2. Create/select a Google Cloud project.
3. Go to APIs & Services -> Library and enable **Google Calendar API**.
4. Configure OAuth consent screen. For a personal/testing app, add your Google account as a test user if required.
5. Go to APIs & Services -> Credentials -> Create Credentials -> OAuth client ID -> Web application.
6. Add this exact Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
7. Copy the Client ID and Client Secret into `.env.local`.
8. This project requests `calendar` scope because it needs to read free/busy data and create events. Keep secrets on the server; never prefix them with `NEXT_PUBLIC_`.

## 4. Start Ollama

In PowerShell:

```powershell
ollama pull llama3.2:1b
ollama serve
```

If Ollama is already running as a Windows service/app, you do not need to start `ollama serve` again. Test in another terminal:

```powershell
ollama run llama3.2:1b
```

## 5. Run the app

```powershell
npm run dev
```

Open http://localhost:3000, click **Connect Google Calendar**, sign in, then enter a meeting title/request, date, and duration. Click **Find available times**, select a returned slot, then click **Confirm & create event**.

## How it works
- `POST /api/ai`: Ollama returns a title and duration suggestion. AI does not decide availability.
- `GET /api/auth/google`: starts Google OAuth.
- `GET /api/auth/google/callback`: exchanges the OAuth code and stores encrypted tokens in an HTTP-only session cookie.
- `GET /api/auth/status`: reports whether a Google account is connected.
- `POST /api/availability`: checks the selected calendar's busy intervals and generates free slots during configured working hours.
- `POST /api/events`: re-checks availability immediately before creating the event, then calls Google Calendar `events.insert`.

## Important limitations
- This starter is intended for local development. For production, use HTTPS, review OAuth consent/verification requirements, add CSRF/rate limiting and persistent server-side token storage, and consider race conditions when multiple people book at once.
- It checks the authenticated user's primary calendar only. It does not guarantee all invitees are available unless their calendars are shared and included in the FreeBusy query.
- Availability can change between checking and creating an event. The server rechecks before inserting, but Google Calendar does not provide an atomic “reserve slot” operation.
- This version uses a single-user local encrypted session cookie and no database.
