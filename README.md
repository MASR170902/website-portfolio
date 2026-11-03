# Modern Engineering Portfolio

Portfolio website with a private admin panel for editing projects, experience, and certificates. The public website and generated CV read from the same SQLite content store.

## Requirements

- Node.js 22.13 or newer
- npm

## Local setup

```bash
npm ci
cp .env.example .env
npm run admin:hash
```

Set `ADMIN_USERNAME` and paste the printed bcrypt hash into `ADMIN_PASSWORD_HASH` in `.env`. Generate a session secret with `openssl rand -base64 48` and set it as `SESSION_SECRET`. Keep `.env` private; it is ignored by Git. Local development uses HTTP cookies; do not set `NODE_ENV=production` locally.

The password setup tool requires at least 10 characters (and no more than 72 bytes, the bcrypt limit). This minimum is shorter than recommended for a production administrator account; do not publish with a short password.

Run the app:

```bash
npm run dev
```

Open the Vite URL shown in the terminal. The admin panel is at `/admin`.

## Admin panel

Sign in at `/admin` to add, edit, or delete:

- Projects, with descriptions, technology tags, links, and optional cover images.
- Professional experience and bullet points.
- Certificates, with issuer, date, credential ID, verification URL, notes, PDF/image file, and optional preview image.

Changes are persisted to SQLite and appear on the website immediately. The CV generator reads the same rendered portfolio content, including project links and certificate links.

## VPS deployment

Configure the production environment variables from `.env.example`, including `NODE_ENV=production`, `PORT=3000`, a strong admin password hash, and a random `SESSION_SECRET`. Put the site behind HTTPS and a reverse proxy such as Nginx; set `TRUST_PROXY=1` when using a single trusted proxy.

```bash
npm ci
npm run build
npm start
```

The server listens on port `3000` by default. Configure the reverse proxy to forward requests to that port. The SQLite database and uploaded files are stored under `storage/`; back up that directory along with the project’s `public/certificates/` files.

## Tests and production build

```bash
npm test
npm run build
```
