# ✦ Free Thinkers Club

An open platform for sharing, reviewing, and downloading independent research. No gatekeeping. No paywalls.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Run Locally

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## Admin Login (username & password)

Credentials are **not** stored in source code. Set them with environment variables (Vite requires the `VITE_` prefix):

| Variable | Description |
|----------|-------------|
| `VITE_ADMIN_USERNAME` | Admin username |
| `VITE_ADMIN_PASSWORD` | Admin password |

**Local development:** copy `.env.example` to `.env` and edit the values.

**Render (production):** after creating the static site, go to **Environment** and add both variables, then redeploy.

If unset, defaults are `admin` / `freethinkers2024` — change these before going live.

> **Note:** This is a static site; admin checks run in the browser. Use a strong password and treat it as convenience access (e.g. delete papers), not high-security authentication.

## Deploy to Render

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub.
2. In [Render](https://render.com): **New → Blueprint** → connect the repo.
3. Set `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` when prompted (or in **Environment** after deploy).
4. Deploy.

### Option B — Manual static site

1. Push to GitHub.
2. **New → Static Site** → connect the repo.
3. Settings:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
4. Add environment variables `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD`.
5. Deploy.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Free Thinkers Club"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/free-thinkers-club.git
git push -u origin main
```

Replace `YOUR_USERNAME` and repo name with yours.

## Features

- Submit papers (title, author, abstract, category, PDF filename)
- Browse, search, and filter by category
- Peer reviews with star ratings
- Download counter
- Admin login to delete publications
- Papers persist in the browser (`localStorage`) per device

## Project Structure

```
├── public/           # Static assets (favicon)
├── src/
│   ├── App.jsx       # Main UI
│   ├── config.js     # Admin credentials from env
│   └── main.jsx
├── .env.example      # Template for local env vars
├── render.yaml       # Render deployment blueprint
└── package.json
```
