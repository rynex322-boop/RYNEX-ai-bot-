# RYNEX INDIA – Super Admin Panel

React + Vite mobile-responsive admin frontend. The matching Cloudflare Worker backend is in the parent folder as `worker.js`.

## Run locally
```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to your deployed Cloudflare Worker URL
npm run dev
```

## Production build
```bash
npm run build
```
Upload `dist/` to Cloudflare Pages. The app uses hash routing (`/#/`), so no SPA rewrite rules are needed.

## Backend
Follow `../INTEGRATION_SETUP.md` to configure the existing Firebase project, Cloudflare Worker, R2 bucket, Telegram webhook, admin authentication, and deployment. Do not put Telegram bot tokens or Firebase service-account private keys in `VITE_` variables or frontend files.
