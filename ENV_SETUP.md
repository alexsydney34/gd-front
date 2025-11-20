# Environment Variables Setup

This project uses environment variables for configuration. Follow these steps to set up your environment.

## Files

- `.env.example` - Template file (committed to git)
- `.env.local` - Your local environment file (ignored by git)
- `.env` - General environment file (ignored by git)

## Setup Instructions

### 1. Copy the example file

```bash
cp .env.example .env.local
```

### 2. Edit `.env.local` with your values

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.golden-duck.lol

# Development Mode
# Set NEXT_PUBLIC_USE_DEV_TOKEN=true to enable dev token
NEXT_PUBLIC_USE_DEV_TOKEN=true
NEXT_PUBLIC_DEV_TOKEN=your_actual_token_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Golden Duck
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Environment Variables

### `NEXT_PUBLIC_API_URL`
- **Description**: Base URL for the API
- **Default**: `https://api.golden-duck.lol`
- **Example**: `https://api.golden-duck.lol`

### `NEXT_PUBLIC_USE_DEV_TOKEN`
- **Description**: Enable/disable dev token for testing (bypasses Telegram auth)
- **Default**: `false`
- **Values**: `true` or `false`
- **Note**: Should be `false` in production

### `NEXT_PUBLIC_DEV_TOKEN`
- **Description**: JWT token for development/testing
- **Default**: Empty string
- **How to get**: Call `/auth/login` endpoint with valid Telegram init data
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### `NEXT_PUBLIC_APP_NAME`
- **Description**: Application name
- **Default**: `Golden Duck`

### `NEXT_PUBLIC_APP_VERSION`
- **Description**: Application version
- **Default**: `1.0.0`

## Important Notes

1. **Never commit `.env.local` or `.env` to git** - they contain sensitive data
2. **Always update `.env.example`** when adding new environment variables
3. **Restart dev server** after changing environment variables
4. **Use `NEXT_PUBLIC_` prefix** for client-side variables in Next.js

## Development vs Production

### Development (local)
```bash
NEXT_PUBLIC_USE_DEV_TOKEN=true
NEXT_PUBLIC_DEV_TOKEN=your_dev_token
```

### Production (Vercel/deployment)
```bash
NEXT_PUBLIC_USE_DEV_TOKEN=false
NEXT_PUBLIC_DEV_TOKEN=
```

## Vercel Deployment

When deploying to Vercel:

1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. Set appropriate values for production
4. Redeploy the project

## Getting a Dev Token

1. Open Telegram Web App in browser
2. Open DevTools → Console
3. Get `window.Telegram.WebApp.initData`
4. Send POST request to `/auth/login`:
   ```bash
   curl -X POST https://api.golden-duck.lol/auth/login \
     -H "Content-Type: application/json" \
     -d '{"init_data": "YOUR_INIT_DATA_HERE"}'
   ```
5. Copy the returned token to `NEXT_PUBLIC_DEV_TOKEN`

